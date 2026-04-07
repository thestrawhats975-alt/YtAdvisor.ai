package com.YtAdvisor.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.PipelineJob;

public interface PipelineJobRepository extends JpaRepository<PipelineJob, UUID> {
    Optional<PipelineJob> findByChannel_Id(UUID channelId);
}
