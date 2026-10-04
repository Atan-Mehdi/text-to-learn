package com.texttolearn.dto;

import com.texttolearn.model.User;

public class AuthResponse {
    private String token;
    private UserSummary user;
    private String message;

    public AuthResponse() {}

    public AuthResponse(String token, UserSummary user, String message) {
        this.token = token;
        this.user = user;
        this.message = message;
    }

    public static class UserSummary {
        private String id;
        private String name;
        private String email;
        private String avatarUrl;
        private String role;

        public UserSummary() {}

        public UserSummary(User user) {
            this.id = user.getId();
            this.name = user.getName();
            this.email = user.getEmail();
            this.avatarUrl = user.getAvatarUrl();
            this.role = user.getRole();
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getAvatarUrl() { return avatarUrl; }
        public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public UserSummary getUser() { return user; }
    public void setUser(UserSummary user) { this.user = user; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
