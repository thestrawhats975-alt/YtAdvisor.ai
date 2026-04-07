package com.YtAdvisor.backend.entities;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "dna_snapshots")
@Getter
@Setter
public class DnaSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "channel_id", nullable = false)
    private Channel channel;

    @Column(name = "dna_summary", columnDefinition = "TEXT")
    private String dnaSummary;

    @Column(name = "audience_age_range")
    private String audienceAgeRange;

    @Column(name = "preferred_format")
    private String preferredFormat;

    @Column(name = "engagement_tone")
    private String engagementTone;

    @Column(name = "recurring_questions", columnDefinition = "TEXT")
    private String recurringQuestions;

    @Column(name = "content_wants_more", columnDefinition = "TEXT")
    private String contentWantsMore;

    @Column(name = "content_complaints", columnDefinition = "TEXT")
    private String contentComplaints;

    @Column(name = "total_comments_analysed")
    private Integer totalCommentsAnalysed = 0;

    @Column(name = "videos_processed")
    private Integer videosProcessed = 0;

    @Column(name = "is_reliable")
    private Boolean isReliable = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}
