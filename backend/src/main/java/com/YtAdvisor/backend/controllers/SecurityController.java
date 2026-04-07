package com.YtAdvisor.backend.controllers;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.YtAdvisor.backend.entities.User;
import com.YtAdvisor.backend.repositories.UserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class SecurityController {

    private UserRepository userRepository;

    public SecurityController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/user/me")
    public Map<String, Object> me() {
        // Grab the Google user object
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        if (!(principal instanceof DefaultOidcUser)) {
            throw new RuntimeException("Not logged in");
        }

        // Extract their Google email
        String email = ((DefaultOidcUser) principal).getEmail();

        // Find the user in your database using their email
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user = userOpt.orElseThrow(() -> new RuntimeException("User not found in database"));

        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "name", user.getName(),
                "tier", user.getTier());
    }

    @GetMapping("/post-login")
    public void postLogin(HttpServletResponse response) throws IOException {
        response.sendRedirect("http://localhost:5173/pricing");
    }

    @GetMapping("/test")
    @ResponseBody
    public String test(HttpServletRequest request) {
        return Arrays.toString(request.getCookies());
    }
}
