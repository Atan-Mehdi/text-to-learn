package com.texttolearn.model;

import java.util.List;

public class Module {
    private String id;
    private String title;
    private String courseId;
    private int order;
    private List<Lesson> lessons;

    public Module() {}

    public Module(String id, String title, String courseId, int order, List<Lesson> lessons) {
        this.id = id;
        this.title = title;
        this.courseId = courseId;
        this.order = order;
        this.lessons = lessons;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public List<Lesson> getLessons() { return lessons; }
    public void setLessons(List<Lesson> lessons) { this.lessons = lessons; }
}
