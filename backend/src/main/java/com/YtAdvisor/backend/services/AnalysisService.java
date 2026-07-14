package com.YtAdvisor.backend.services;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.YtAdvisor.backend.entities.AnalysisRequest;
import com.YtAdvisor.backend.entities.AnalysisResponse;
import com.YtAdvisor.backend.entities.Channel;
import com.YtAdvisor.backend.entities.DnaSnapshot;
import com.YtAdvisor.backend.entities.User;
import com.YtAdvisor.backend.repositories.AnalysisRequestRepository;
import com.YtAdvisor.backend.repositories.AnalysisResponseRepository;
import com.YtAdvisor.backend.repositories.ChannelRepository;
import com.YtAdvisor.backend.repositories.DnaSnapshotRepository;
import com.YtAdvisor.backend.repositories.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisService {

    private final UserRepository userRepository;
    private final ChannelRepository channelRepository;
    private final DnaSnapshotRepository dnaSnapshotRepository;
    private final AnalysisRequestRepository analysisRequestRepository;
    private final AnalysisResponseRepository analysisResponseRepository;
    private final PythonClient pythonClient;
    private final ObjectMapper objectMapper;
    private final TierService tierService;
    // TransactionTemplate is auto-configured by Spring Boot when spring-boot-starter-data-jpa
    // is present — no extra bean definition needed.
    private final TransactionTemplate transactionTemplate;

    /*
     * NOT @Transactional — the previous @Transactional on this method held a DB
     * connection open for the entire duration of callAutoAnalyze(), which can take
     * up to 180 seconds. With a default HikariCP pool of 10, even a handful of
     * concurrent analysis requests would exhaust all connections and freeze the app.
     *
     * Fix: each group of DB writes now runs in its own short TransactionTemplate
     * block that commits immediately, freeing the connection back to the pool before
     * the network call to Python begins.
     */
    public JsonNode analyse(UUID userId, String videoIdea) {

        // ── Step 1: Load user ─────────────────────────────────────────────────
        // Simple read — Spring Data's built-in @Transactional(readOnly) handles it.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        // ── Step 2: Tier check ────────────────────────────────────────────────
        // TierService.checkAndConsumeRequest is @Transactional, so it opens and
        // commits its own short transaction. No outer transaction wraps it.
        tierService.checkAndConsumeRequest(user);

        // ── Step 3: Load channel and latest reliable DNA ──────────────────────
        Channel channel = channelRepository.findByUser_Id(userId).orElse(null);
        String creatorDna = null;
        if (channel != null) {
            DnaSnapshot snap = dnaSnapshotRepository
                    .findTopByChannel_IdOrderByCreatedAtDesc(channel.getId())
                    .orElse(null);
            if (snap != null && Boolean.TRUE.equals(snap.getIsReliable())) {
                creatorDna = snap.getDnaSummary();
                log.info("[analysis] using DNA snapshot for channel: {}", channel.getYoutubeChannelId());
            }
        }

        // ── Step 4: Persist PROCESSING record ────────────────────────────────
        // TransactionTemplate opens a transaction, saves, and commits immediately.
        // The DB connection is returned to the pool before we call Python.
        final Channel finalChannel = channel;
        final String finalCreatorDna = creatorDna;
        final AnalysisRequest analysisRequest = transactionTemplate.execute(status -> {
            AnalysisRequest req = new AnalysisRequest();
            req.setUser(user);
            req.setChannel(finalChannel);
            req.setVideoIdea(videoIdea);
            req.setCreatorDnaUsed(finalCreatorDna);
            req.setStatus("PROCESSING");
            return analysisRequestRepository.save(req);
        });

        // ── Step 5: Call Python ───────────────────────────────────────────────
        // No database connection is held here. This call can take 60–180 seconds.
        JsonNode rawJson;
        try {
            String rawString = pythonClient.callAutoAnalyze(videoIdea, creatorDna);
            rawJson = objectMapper.readTree(rawString);
        } catch (Exception e) {
            log.error("[analysis] Python call failed: {}", e.getMessage());
            // Short transaction just to mark the record as FAILED, then release.
            transactionTemplate.execute(status -> {
                analysisRequest.setStatus("FAILED");
                analysisRequest.setErrorMessage(e.getMessage());
                analysisRequest.setCompletedAt(OffsetDateTime.now());
                return analysisRequestRepository.save(analysisRequest);
            });
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Analysis service error: " + e.getMessage());
        }

        // ── Step 6: Persist result and mark COMPLETED ─────────────────────────
        // Another short transaction — response save + analytics + status update,
        // all committed atomically, connection released immediately after.
        final JsonNode finalRawJson = rawJson;
        transactionTemplate.execute(status -> {
            String rawStr;
            try {
                rawStr = objectMapper.writeValueAsString(finalRawJson);
            } catch (JsonProcessingException ex) {
                rawStr = "{}";
            }

            AnalysisResponse analysisResponse = new AnalysisResponse();
            analysisResponse.setRequest(analysisRequest);
            analysisResponse.setRawResponse(rawStr);
            analysisResponse.setFinalVerdict(
                    finalRawJson.path("verdict").path("final_verdict").asText(null));
            analysisResponse.setConfidence(
                    finalRawJson.path("verdict").path("confidence").asText(null));
            analysisResponse.setSmallCreatorVerdict(
                    finalRawJson.path("market").path("small_creator_verdict").asText(null));
            analysisResponseRepository.save(analysisResponse);

            // recordAnalysisRun is @Transactional(REQUIRED) — joins the current tx.
            tierService.recordAnalysisRun(user);

            analysisRequest.setStatus("COMPLETED");
            analysisRequest.setCompletedAt(OffsetDateTime.now());
            analysisRequestRepository.save(analysisRequest);

            log.info("[analysis] completed for userId={}, verdict={}",
                    userId, analysisResponse.getFinalVerdict());

            return null;
        });

        return rawJson;
    }
}
