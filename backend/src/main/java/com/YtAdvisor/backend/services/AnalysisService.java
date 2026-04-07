package com.YtAdvisor.backend.services;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Transactional
    public JsonNode analyse(UUID userId, String videoIdea) {
        // 1. Load user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        // Check tier and consume request
        tierService.checkAndConsumeRequest(user);

        // 2. Load channel and latest reliable DNA (if available)
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

        // 3. Save request as PROCESSING
        AnalysisRequest analysisRequest = new AnalysisRequest();
        analysisRequest.setUser(user);
        analysisRequest.setChannel(channel);
        analysisRequest.setVideoIdea(videoIdea);
        analysisRequest.setCreatorDnaUsed(creatorDna);
        analysisRequest.setStatus("PROCESSING");
        analysisRequest = analysisRequestRepository.save(analysisRequest);

        // 4. Call Python
        JsonNode rawJson;
        try {
            String rawString = pythonClient.callAutoAnalyze(videoIdea, creatorDna);
            rawJson = objectMapper.readTree(rawString);
        } catch (Exception e) {
            log.error("[analysis] Python call failed: {}", e.getMessage());
            analysisRequest.setStatus("FAILED");
            analysisRequest.setErrorMessage(e.getMessage());
            analysisRequest.setCompletedAt(OffsetDateTime.now());
            analysisRequestRepository.save(analysisRequest);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Analysis service error: " + e.getMessage());
        }

        // 5. Persist full response
        String rawStr;
        try {
            rawStr = objectMapper.writeValueAsString(rawJson);
        } catch (JsonProcessingException e) {
            rawStr = "{}";
        }

        AnalysisResponse analysisResponse = new AnalysisResponse();
        analysisResponse.setRequest(analysisRequest);
        analysisResponse.setRawResponse(rawStr);
        analysisResponse.setFinalVerdict(
                rawJson.path("verdict").path("final_verdict").asText(null));
        analysisResponse.setConfidence(
                rawJson.path("verdict").path("confidence").asText(null));
        analysisResponse.setSmallCreatorVerdict(
                rawJson.path("market").path("small_creator_verdict").asText(null));
        analysisResponseRepository.save(analysisResponse);

        // Record usage for tier limits
        tierService.recordAnalysisRun(user);

        // 6. Mark request complete
        analysisRequest.setStatus("COMPLETED");
        analysisRequest.setCompletedAt(OffsetDateTime.now());
        analysisRequestRepository.save(analysisRequest);

        log.info("[analysis] completed for userId={}, verdict={}",
                userId, analysisResponse.getFinalVerdict());

        return rawJson;
    }
}
