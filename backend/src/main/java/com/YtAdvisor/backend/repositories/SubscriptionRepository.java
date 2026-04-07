package com.YtAdvisor.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.Subscription;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    List<Subscription> findByUser_IdOrderByStartedAtDesc(UUID userId);
    Optional<Subscription> findTopByUser_IdAndEndedAtIsNullOrderByStartedAtDesc(UUID userId);
}
