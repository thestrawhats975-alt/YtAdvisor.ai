package com.YtAdvisor.backend.services;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.YtAdvisor.backend.dto.PipelineStartResponse;
import com.YtAdvisor.backend.dto.PipelineStatusResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PythonClient {

        private final WebClient pythonWebClient;

        public String callAutoAnalyze(String videoIdea, String creatorDna) {
                Map<String, Object> body = new HashMap<>();
                body.put("video_idea", videoIdea);
                if (creatorDna != null && !creatorDna.isBlank()) {
                        body.put("creator_dna", creatorDna);
                }

                return pythonWebClient
                                .post()
                                .uri("/api/v1/analyze/auto")
                                .bodyValue(body)
                                .retrieve()
                                .onStatus(
                                                status -> !status.is2xxSuccessful(),
                                                clientResponse -> clientResponse.bodyToMono(String.class)
                                                                .map(errorBody -> new RuntimeException(
                                                                                "Python analysis error ["
                                                                                                + clientResponse.statusCode()
                                                                                                + "]: " + errorBody)))
                                .bodyToMono(String.class)
                                .timeout(Duration.ofSeconds(180))
                                .block();
        }

        public PipelineStartResponse callPipelineStart(String channelId, String youtubeApiKey) {
                Map<String, Object> body = new HashMap<>();
                body.put("channel_id", channelId);
                if (youtubeApiKey != null && !youtubeApiKey.isBlank()) {
                        body.put("youtube_api_key", youtubeApiKey);
                }

                return pythonWebClient
                                .post()
                                .uri("/api/v1/audience/pipeline/start")
                                .bodyValue(body)
                                .retrieve()
                                .onStatus(
                                                status -> !status.is2xxSuccessful(),
                                                clientResponse -> clientResponse.bodyToMono(String.class)
                                                                .map(errorBody -> new RuntimeException(
                                                                                "Pipeline start error ["
                                                                                                + clientResponse.statusCode()
                                                                                                + "]: " + errorBody)))
                                .bodyToMono(PipelineStartResponse.class)
                                .timeout(Duration.ofSeconds(60))
                                .block();
        }

        /**
         * Returns null if the channel has no pipeline (404), throws on other errors.
         */
        public PipelineStatusResponse callPipelineStatus(String channelId) {
                try {
                        return pythonWebClient
                                        .get()
                                        .uri("/api/v1/audience/pipeline/status/{channelId}", channelId)
                                        .retrieve()
                                        .onStatus(
                                                        status -> !status.is2xxSuccessful()
                                                                        && !status.isSameCodeAs(HttpStatus.NOT_FOUND),
                                                        clientResponse -> clientResponse.bodyToMono(String.class)
                                                                        .map(errorBody -> new RuntimeException(
                                                                                        "Pipeline status error ["
                                                                                                        + clientResponse.statusCode()
                                                                                                        + "]: "
                                                                                                        + errorBody)))
                                        .bodyToMono(PipelineStatusResponse.class)
                                        .timeout(Duration.ofSeconds(30))
                                        .block();
                } catch (WebClientResponseException.NotFound e) {
                        log.warn("[PythonClient] no pipeline found for channel: {}", channelId);
                        return null;
                }
        }
}
