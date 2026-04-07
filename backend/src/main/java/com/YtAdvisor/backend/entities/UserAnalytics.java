package com.YtAdvisor.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_analytics")
@Getter
@Setter
public class UserAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_analyses_run", nullable = false)
    private Integer totalAnalysesRun = 0;

    @Column(name = "total_pro_activations", nullable = false)
    private Integer totalProActivations = 0;

    @Column(name = "total_ultimate_activations", nullable = false)
    private Integer totalUltimateActivations = 0;

    @Column(name = "total_downgrades", nullable = false)
    private Integer totalDowngrades = 0;

    @Column(name = "channel_connected_at")
    private OffsetDateTime channelConnectedAt;

    @Column(name = "pipeline_completed_at")
    private OffsetDateTime pipelineCompletedAt;

    @Column(name = "first_analysis_at")
    private OffsetDateTime firstAnalysisAt;

    @Column(name = "last_analysis_at")
    private OffsetDateTime lastAnalysisAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
