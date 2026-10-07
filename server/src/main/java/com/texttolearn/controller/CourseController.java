package com.texttolearn.controller;

import com.texttolearn.dto.GenerateCourseRequest;
import com.texttolearn.model.Course;
import com.texttolearn.service.CourseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateCourse(@RequestBody GenerateCourseRequest request) {
        String creator = request.getCreator();
        if (creator == null || creator.trim().isEmpty() || "anonymous".equalsIgnoreCase(creator.trim())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(java.util.Map.of("error", "You must be signed in to generate and save a course."));
        }
        Course course = courseService.generateAndSaveCourse(request.getTopic(), creator.trim());
        return ResponseEntity.ok(course);
    }

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses(@RequestParam(required = false) String user) {
        return ResponseEntity.ok(courseService.getAllCourses(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(
            @PathVariable String id,
            @RequestParam(required = false) String user) {
        java.util.Optional<Course> courseOpt = courseService.getCourseById(id);
        if (courseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Course course = courseOpt.get();
        if (!courseService.isCourseAccessible(course, user)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of(
                            "error", "Access denied. You must be signed in as the course creator to view this course.",
                            "isPrivate", true
                    ));
        }
        return ResponseEntity.ok(course);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(
            @PathVariable String id,
            @RequestParam(required = false) String user) {
        java.util.Optional<Course> courseOpt = courseService.getCourseById(id);
        if (courseOpt.isPresent() && !courseService.isCourseAccessible(courseOpt.get(), user)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(java.util.Map.of("error", "You do not have permission to delete this course."));
        }
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanupCourses(@RequestParam(defaultValue = "3") int keep) {
        int deleted = courseService.cleanupOldCourses(keep);
        return ResponseEntity.ok(java.util.Map.of("deleted", deleted, "remaining", keep));
    }

    @PostMapping("/cache/clear")
    public ResponseEntity<?> clearCache() {
        courseService.clearCache();
        return ResponseEntity.ok(java.util.Map.of("message", "In-memory LRU cache cleared successfully."));
    }
}
