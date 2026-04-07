package com.YtAdvisor.backend.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "analysis_requests")
@Getter
@Setter
public class AnalysisRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id")
    private Channel channel;

    @Column(name = "video_idea", nullable = false, columnDefinition = "TEXT")
    private String videoIdea;

    @Column(name = "creator_dna_used", columnDefinition = "TEXT")
    private String creatorDnaUsed;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @OneToOne(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private AnalysisResponse response;
}