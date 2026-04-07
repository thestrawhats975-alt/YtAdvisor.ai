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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "analysis_responses")
@Getter
@Setter
public class AnalysisResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false, unique = true)
    private AnalysisRequest request;

    @Column(name = "raw_response", nullable = false, columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "final_verdict")
    private String finalVerdict;

    @Column(name = "confidence")
    private String confidence;

    @Column(name = "small_creator_verdict")
    private String smallCreatorVerdict;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;
}
