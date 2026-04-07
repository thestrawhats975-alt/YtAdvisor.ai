package com.YtAdvisor.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.YtAdvisor.backend.dto.AnalysisRequestDto;
import com.YtAdvisor.backend.entities.User;
import com.YtAdvisor.backend.repositories.UserRepository;
import com.YtAdvisor.backend.services.AnalysisService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analysis")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @PostMapping(produces = "application/json")
    public ResponseEntity<String> analyse(@Valid @RequestBody AnalysisRequestDto dto) {
        System.out.println("Received analysis request: " + dto);

        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof DefaultOidcUser)) {
            throw new RuntimeException("Not logged in");
        }

        String email = ((DefaultOidcUser) principal).getEmail();
        User user = userRepository.findByEmail(email).orElseThrow();

        JsonNode result = analysisService.analyse(user.getId(), dto.getVideoIdea());

        try {
            return ResponseEntity.ok(objectMapper.writeValueAsString(result));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize response", e);
        }
    }
}
