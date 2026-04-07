package com.YtAdvisor.backend.repositories;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.AnalysisResponse;

public interface AnalysisResponseRepository extends JpaRepository<AnalysisResponse, UUID> {
}
