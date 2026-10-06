package com.texttolearn.controller;

import com.texttolearn.model.Lesson;
import com.texttolearn.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final CourseService courseService;

    public LessonController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping("/{courseId}/{moduleId}/{lessonId}")
    public ResponseEntity<?> getLesson(
            @PathVariable String courseId,
            @PathVariable String moduleId,
            @PathVariable String lessonId,
            @RequestParam(required = false) String user) {
        java.util.Optional<com.texttolearn.model.Course> courseOpt = courseService.getCourseById(courseId);
        if (courseOpt.isPresent()) {
            if (!courseService.isCourseAccessible(courseOpt.get(), user)) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                        .body(java.util.Map.of(
                                "error", "Access denied. You must be signed in as the course creator to view this lesson.",
                                "isPrivate", true
                        ));
            }
        }
        Lesson lesson = courseService.getOrGenerateLesson(courseId, moduleId, lessonId);
        return ResponseEntity.ok(lesson);
    }

    @PostMapping("/{lessonId}/translate/hinglish")
    public ResponseEntity<Map<String, String>> getHinglishTranslation(@PathVariable String lessonId) {
        String explanation = courseService.translateLessonToHinglish(lessonId);
        return ResponseEntity.ok(Map.of("explanation", explanation));
    }
}
