package com.texttolearn.service;

import com.texttolearn.dto.AuthResponse;
import com.texttolearn.dto.LoginRequest;
import com.texttolearn.dto.RegisterRequest;
import com.texttolearn.model.User;
import com.texttolearn.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    public void initDemoUsers() {
        if (!userRepository.existsByEmail("operator@text-to-learn.ai")) {
            User demo = new User(
                "Operator",
                "operator@text-to-learn.ai",
                hashPassword("password123"),
                "https://api.dicebear.com/7.x/bottts/svg?seed=operator@text-to-learn.ai"
            );
            demo.setRole("ADMIN");
            userRepository.save(demo);
        }
    }

    public AuthResponse register(RegisterRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        String cleanEmail = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        String name = req.getName();
        if (name == null || name.trim().isEmpty()) {
            name = cleanEmail.split("@")[0];
        }

        String avatarUrl = req.getAvatarUrl();
        if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
            avatarUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=" + cleanEmail;
        }

        User user = new User(name.trim(), cleanEmail, hashPassword(req.getPassword()), avatarUrl);
        user = userRepository.save(user);

        String token = generateToken(user);
        return new AuthResponse(token, new AuthResponse.UserSummary(user), "Account created successfully.");
    }

    public AuthResponse login(LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (req.getPassword() == null) {
            throw new IllegalArgumentException("Password is required.");
        }

        String cleanEmail = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!user.getPassword().equals(hashPassword(req.getPassword()))) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        String token = generateToken(user);
        return new AuthResponse(token, new AuthResponse.UserSummary(user), "Logged in successfully.");
    }

    public AuthResponse syncOAuthUser(com.texttolearn.dto.OAuthSyncRequest req) {
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("OAuth email is required.");
        }

        String cleanEmail = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail).orElse(null);

        if (user == null) {
            String name = req.getName();
            if (name == null || name.trim().isEmpty()) {
                name = cleanEmail.split("@")[0];
            }
            String avatarUrl = req.getAvatarUrl();
            if (avatarUrl == null || avatarUrl.trim().isEmpty()) {
                avatarUrl = "https://api.dicebear.com/7.x/bottts/svg?seed=" + cleanEmail;
            }

            user = new User(name.trim(), cleanEmail, "", avatarUrl);
            user.setProvider("AUTH0");
            user.setAuth0Sub(req.getSub());
            user = userRepository.save(user);
        } else {

            if (req.getName() != null && !req.getName().trim().isEmpty()) {
                user.setName(req.getName().trim());
            }
            if (req.getAvatarUrl() != null && !req.getAvatarUrl().trim().isEmpty()) {
                user.setAvatarUrl(req.getAvatarUrl());
            }
            if (req.getSub() != null) {
                user.setAuth0Sub(req.getSub());
            }
            user.setUpdatedAt(Instant.now());
            user = userRepository.save(user);
        }

        String token = generateToken(user);
        return new AuthResponse(token, new AuthResponse.UserSummary(user), "OAuth user synced successfully.");
    }

    public Optional<User> getUserFromToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return Optional.empty();
        }

        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        try {
            byte[] decoded = Base64.getDecoder().decode(cleanToken);
            String payload = new String(decoded, StandardCharsets.UTF_8);
            String[] parts = payload.split(":");
            if (parts.length >= 2) {
                String email = parts[0];
                return userRepository.findByEmail(email);
            }
        } catch (Exception e) {

        }
        return Optional.empty();
    }

    private String generateToken(User user) {
        String payload = user.getEmail() + ":" + Instant.now().toEpochMilli();
        return Base64.getEncoder().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    private String hashPassword(String password) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(("SALT_TEXT_TO_LEARN_" + password).getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }
}
