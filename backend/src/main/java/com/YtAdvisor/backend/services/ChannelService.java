package com.YtAdvisor.backend.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.YtAdvisor.backend.dto.PipelineStartResponse;
import com.YtAdvisor.backend.entities.Channel;
import com.YtAdvisor.backend.entities.User;
import com.YtAdvisor.backend.entities.UserTier;
import com.YtAdvisor.backend.repositories.ChannelRepository;
import com.YtAdvisor.backend.repositories.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChannelService {

    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final PythonClient pythonClient;
    private final PipelineService pipelineService;
    private final TierService tierService;

    @Value("${youtube.api-key:}")
    private String youtubeApiKey;

    @Transactional
    public Channel connectChannel(UUID userId, String channelInput) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));

        if (user.getTier() == UserTier.STARTER) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN, "Channel connection requires a paid plan");
        }

        // 1. Tell Python to start/resume pipeline — Python resolves handle/URL to channel ID
        PipelineStartResponse startResp = pythonClient.callPipelineStart(channelInput, youtubeApiKey);
        if (startResp == null || startResp.getChannelId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "Could not start audience pipeline — Python unreachable");
        }

        String resolvedChannelId = startResp.getChannelId();
        log.info("[channel] resolved channelId={} for input={}", resolvedChannelId, channelInput);

        // 2. Upsert channel record
        Channel channel = channelRepository.findByUser_Id(userId)
                .orElse(new Channel());
        channel.setUser(user);
        channel.setYoutubeChannelId(resolvedChannelId);
        channel = channelRepository.save(channel);

        // 3. Immediately sync status to populate title, phase, etc.
        try {
            pipelineService.syncPipelineStatus(channel);
            // Reload to pick up any title update syncPipelineStatus may have saved
            channel = channelRepository.findById(channel.getId()).orElse(channel);
        } catch (Exception e) {
            // Non-fatal — channel is saved, sync will run on next scheduler tick
            log.warn("[channel] initial status sync failed for {}: {}", resolvedChannelId, e.getMessage());
        }
        
        tierService.recordChannelConnected(user);

        return channel;
    }
}
