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
    public ResponseEntity<Course> getCourseById(@PathVariable String id) {
        return courseService.getCourseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable String id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cleanup")
    public ResponseEntity<?> cleanupCourses(@RequestParam(defaultValue = "3") int keep) {
        int deleted = courseService.cleanupOldCourses(keep);
        return ResponseEntity.ok(java.util.Map.of("deleted", deleted, "remaining", keep));
    }
}
