package com.texttolearn.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "lessons")
public class Lesson {
    @Id
    private String id;
    private String title;
    private String courseId;
    private String moduleId;
    private List<String> objectives = new ArrayList<>();
    private List<ContentBlock> content = new ArrayList<>();
    private String hinglishExplanation;
    private boolean enriched;

    public Lesson() {}

    public Lesson(String id, String title, String courseId, String moduleId, List<String> objectives, List<ContentBlock> content, String hinglishExplanation, boolean enriched) {
        this.id = id;
        this.title = title;
        this.courseId = courseId;
        this.moduleId = moduleId;
        this.objectives = objectives;
        this.content = content;
        this.hinglishExplanation = hinglishExplanation;
        this.enriched = enriched;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getModuleId() { return moduleId; }
    public void setModuleId(String moduleId) { this.moduleId = moduleId; }

    public List<String> getObjectives() { return objectives; }
    public void setObjectives(List<String> objectives) { this.objectives = objectives; }

    public List<ContentBlock> getContent() { return content; }
    public void setContent(List<ContentBlock> content) { this.content = content; }

    public String getHinglishExplanation() { return hinglishExplanation; }
    public void setHinglishExplanation(String hinglishExplanation) { this.hinglishExplanation = hinglishExplanation; }

    public boolean isEnriched() { return enriched; }
    public void setEnriched(boolean enriched) { this.enriched = enriched; }
}
