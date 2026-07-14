package com.YtAdvisor.backend.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.YtAdvisor.backend.dto.AnalysisRequestDto;
import com.YtAdvisor.backend.entities.User;
import com.YtAdvisor.backend.repositories.UserRepository;
import com.YtAdvisor.backend.security.AuthUtil;
import com.YtAdvisor.backend.services.AnalysisStreamService;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisStreamController {

    private final AnalysisStreamService analysisStreamService;
    private final UserRepository userRepository;

    /**
     * POST /api/analysis/stream
     *
     * Streaming version of POST /api/analysis.
     * Returns text/event-stream with events:
     *   - progress  {"message": "..."}  one per pipeline stage / key rotation
     *   - result    {full DimenziqAnalysisOutput JSON}
     *   - error     {"message": "..."}
     *
     * Auth is enforced by JwtAuthFilter exactly like every other /api/** endpoint.
     * Tier limits are checked synchronously before the stream opens.
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAnalysis(@Valid @RequestBody AnalysisRequestDto dto,
                                     HttpServletResponse response) {
        // Disable Render/Nginx response buffering so SSE events are flushed immediately
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");

        UUID userId = AuthUtil.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return analysisStreamService.startStream(user, dto.getVideoIdea());
    }
}
