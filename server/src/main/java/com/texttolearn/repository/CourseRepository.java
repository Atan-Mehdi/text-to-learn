package com.texttolearn.repository;

import com.texttolearn.model.Course;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends MongoRepository<Course, String> {
    List<Course> findByCreator(String creator);
    List<Course> findAllByOrderByCreatedAtDesc();
}
