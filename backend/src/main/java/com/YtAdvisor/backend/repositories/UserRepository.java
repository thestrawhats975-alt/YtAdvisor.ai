package com.YtAdvisor.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.YtAdvisor.backend.entities.User;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByEmail(String email);
}
