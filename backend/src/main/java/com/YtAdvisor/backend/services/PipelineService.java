package com.YtAdvisor.backend.services;

import java.time.OffsetDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.YtAdvisor.backend.dto.PipelineStartResponse;
import com.YtAdvisor.backend.dto.PipelineStatusResponse;
import com.YtAdvisor.backend.entities.Channel;
import com.YtAdvisor.backend.entities.DnaSnapshot;
import com.YtAdvisor.backend.entities.PipelineJob;
import com.YtAdvisor.backend.repositories.ChannelRepository;
import com.YtAdvisor.backend.repositories.DnaSnapshotRepository;
import com.YtAdvisor.backend.repositories.PipelineJobRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PipelineService {

    private final PythonClient pythonClient;
    private final PipelineJobRepository pipelineJobRepository;
    private final DnaSnapshotRepository dnaSnapshotRepository;
    private final ChannelRepository channelRepository;

    @Value("${youtube.api-key:}")
    private String youtubeApiKey;

    @Transactional
    public void startPipeline(Channel channel) {
        log.info("[pipeline] starting for channel: {}", channel.getYoutubeChannelId());
        PipelineStartResponse resp = pythonClient.callPipelineStart(
                channel.getYoutubeChannelId(), youtubeApiKey);
        if (resp == null) {
            log.warn("[pipeline] start returned null for channel: {}", channel.getYoutubeChannelId());
            return;
        }
        upsertPipelineJobFromStart(channel, resp.getPhase());
    }

    @Transactional
    public void syncPipelineStatus(Channel channel) {
        PipelineStatusResponse status =
                pythonClient.callPipelineStatus(channel.getYoutubeChannelId());
        if (status == null) {
            log.debug("[pipeline] no status available for channel: {}", channel.getYoutubeChannelId());
            return;
        }

        // Update channel title if Python resolved it
        if (status.getChannelTitle() != null
                && !status.getChannelTitle().isBlank()
                && !status.getChannelTitle().equals(channel.getChannelTitle())) {
            channel.setChannelTitle(status.getChannelTitle());
            channelRepository.save(channel);
        }

        applyStatusToJob(channel, status);
    }

    private void upsertPipelineJobFromStart(Channel channel, String phase) {
        PipelineJob job = pipelineJobRepository
                .findByChannel_Id(channel.getId())
                .orElse(new PipelineJob());
        job.setChannel(channel);
        job.setPhase(phase != null ? phase : "BOOTSTRAPPING");
        job.setLastRunAt(OffsetDateTime.now());
        pipelineJobRepository.save(job);
    }

    private void applyStatusToJob(Channel channel, PipelineStatusResponse status) {
        PipelineJob job = pipelineJobRepository
                .findByChannel_Id(channel.getId())
                .orElse(new PipelineJob());

        job.setChannel(channel);
        job.setPhase(status.getPhase());
        job.setTotalVideosOnChannel(status.getTotalVideosOnChannel());
        job.setVideosProcessed(status.getVideosProcessed());
        job.setIsReliable(status.isReliable());
        job.setLastError(status.getLastError());
        job.setLastRunAt(OffsetDateTime.now());
        pipelineJobRepository.save(job);

        // Persist DNA snapshot if one came back and it's non-empty
        if (status.getDnaSummary() != null && !status.getDnaSummary().isBlank()) {
            DnaSnapshot snap = new DnaSnapshot();
            snap.setChannel(channel);
            snap.setDnaSummary(status.getDnaSummary());
            snap.setIsReliable(status.isReliable());
            snap.setVideosProcessed(status.getVideosProcessed());
            dnaSnapshotRepository.save(snap);
            log.info("[pipeline] DNA snapshot saved for channel: {}", channel.getYoutubeChannelId());
        }
    }
}
