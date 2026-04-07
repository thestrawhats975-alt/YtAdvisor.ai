package com.YtAdvisor.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.DnaSnapshot;

public interface DnaSnapshotRepository extends JpaRepository<DnaSnapshot, UUID> {
    Optional<DnaSnapshot> findTopByChannel_IdOrderByCreatedAtDesc(UUID channelId);
}
