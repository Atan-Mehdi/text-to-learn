package com.texttolearn.controller;

import com.texttolearn.model.Lesson;
import com.texttolearn.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class LessonController {

    private final CourseService courseService;

    public LessonController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/{courseId}/{moduleId}/{lessonId}")
    public ResponseEntity<Lesson> getLesson(
            @PathVariable String courseId,
            @PathVariable String moduleId,
            @PathVariable String lessonId) {
        Lesson lesson = courseService.getOrGenerateLesson(courseId, moduleId, lessonId);
        return ResponseEntity.ok(lesson);
    }

    @PostMapping("/{lessonId}/translate/hinglish")
    public ResponseEntity<Map<String, String>> getHinglishTranslation(@PathVariable String lessonId) {
        String explanation = courseService.translateLessonToHinglish(lessonId);
        return ResponseEntity.ok(Map.of("explanation", explanation));
    }
}
