package com.YtAdvisor.backend.schedulers;


import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.YtAdvisor.backend.entities.Channel;
import com.YtAdvisor.backend.entities.PipelineJob;
import com.YtAdvisor.backend.repositories.ChannelRepository;
import com.YtAdvisor.backend.repositories.UserRepository;
import com.YtAdvisor.backend.services.PipelineService;
import com.YtAdvisor.backend.services.TierService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PipelineStatusScheduler {

    private final ChannelRepository channelRepository;
    private final PipelineService pipelineService;
    private final TierService tierService;
    private final UserRepository userRepository;

    // Runs every 30 minutes
    @Scheduled(fixedDelay = 1_800_000)
    public void syncAllPipelines() {
        List<Channel> channels = channelRepository.findAll();
        log.info("[scheduler] syncing {} channels", channels.size());

        for (Channel channel : channels) {
            try {
                pipelineService.syncPipelineStatus(channel);
                log.info("[scheduler] synced channel: {} phase={}",
                        channel.getYoutubeChannelId(),
                        channel.getPipelineJob() != null
                                ? channel.getPipelineJob().getPhase()
                                : "NO_JOB");
                PipelineJob job = channel.getPipelineJob();
                if (job != null && Boolean.TRUE.equals(job.getIsReliable())) {
                    userRepository.findById(channel.getUser().getId()).ifPresent(user -> {
                        tierService.recordPipelineCompleted(user);
                    });
            }
            } catch (Exception e) {
                log.error("[scheduler] sync failed for channel {}: {}",
                        channel.getYoutubeChannelId(), e.getMessage());
            }
        }
    }
}
