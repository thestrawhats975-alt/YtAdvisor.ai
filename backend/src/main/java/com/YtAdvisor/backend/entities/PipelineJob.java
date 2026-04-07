package com.YtAdvisor.backend.entities;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "pipeline_jobs")
@Getter
@Setter
public class PipelineJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false, unique = true)
    private Channel channel;

    @Column(nullable = false)
    private String phase = "BOOTSTRAPPING";

    @Column(name = "total_videos_on_channel")
    private Integer totalVideosOnChannel = 0;

    @Column(name = "videos_processed")
    private Integer videosProcessed = 0;

    @Column(name = "current_batch_index")
    private Integer currentBatchIndex = 0;

    @Column(name = "is_reliable")
    private Boolean isReliable = false;

    @Column(name = "consecutive_failures")
    private Integer consecutiveFailures = 0;

    @Column(name = "last_error")
    private String lastError;

    @Column(name = "last_run_at")
    private OffsetDateTime lastRunAt;

    @Column(name = "next_run_at")
    private OffsetDateTime nextRunAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
