package com.makeithook.v_10.controllers;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/v1")
public class AnalysisController {

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/analyze")
    public ResponseEntity<String> analyzeIdea(@RequestBody Map<String, Object> payload) {
        System.out.println("Received payload: " + payload);
        // This is the URL of your Python FastAPI server
        String pythonBackendUrl = "http://localhost:8000/api/v1/analyze";
        
        try {
            // Forward the exact payload from React straight to Python
            ResponseEntity<String> response = restTemplate.postForEntity(pythonBackendUrl, payload, String.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("{\"error\": \"Python backend failed: " + e.getMessage() + "\"}");
        }
    }
}
