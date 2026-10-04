package com.texttolearn.dto;

public class GenerateCourseRequest {
    private String topic;
    private String creator;

    public GenerateCourseRequest() {}

    public GenerateCourseRequest(String topic, String creator) {
        this.topic = topic;
        this.creator = creator;
    }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public String getCreator() { return creator; }
    public void setCreator(String creator) { this.creator = creator; }
}
