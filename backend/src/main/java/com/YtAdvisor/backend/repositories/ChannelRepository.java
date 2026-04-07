package com.YtAdvisor.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.Channel;

public interface ChannelRepository extends JpaRepository<Channel, UUID> {
    Optional<Channel> findByUser_Id(UUID userId);
}
