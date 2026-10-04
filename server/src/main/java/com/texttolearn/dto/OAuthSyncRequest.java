package com.texttolearn.dto;

public class OAuthSyncRequest {
    private String name;
    private String email;
    private String avatarUrl;
    private String sub;

    public OAuthSyncRequest() {}

    public OAuthSyncRequest(String name, String email, String avatarUrl, String sub) {
        this.name = name;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.sub = sub;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getSub() { return sub; }
    public void setSub(String sub) { this.sub = sub; }
}
