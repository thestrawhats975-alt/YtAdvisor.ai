package com.YtAdvisor.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.UserAnalytics;

import java.util.Optional;
import java.util.UUID;

public interface UserAnalyticsRepository extends JpaRepository<UserAnalytics, UUID> {
    Optional<UserAnalytics> findByUser_Id(UUID userId);
}
