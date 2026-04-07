package com.YtAdvisor.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.AnalysisRequest;

public interface AnalysisRequestRepository extends JpaRepository<AnalysisRequest, UUID> {
    List<AnalysisRequest> findByUser_IdOrderByCreatedAtDesc(UUID userId);
}
