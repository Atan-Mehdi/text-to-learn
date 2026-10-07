package com.texttolearn.service;

import com.texttolearn.model.ContentBlock;
import com.texttolearn.model.Course;
import com.texttolearn.model.Lesson;
import com.texttolearn.model.Module;
import com.texttolearn.repository.CourseRepository;
import com.texttolearn.repository.LessonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CourseService {

    @Autowired(required = false)
    private CourseRepository courseRepository;

    @Autowired(required = false)
    private LessonRepository lessonRepository;

    private final GeminiService geminiService;
    private final YouTubeService youTubeService;

    @Value("${spring.data.mongodb.uri:}")
    private String mongoUri;

    private static final int MAX_CACHE_COURSES = 30;
    private static final int MAX_CACHE_LESSONS = 100;

    private static class LRUCache<K, V> extends LinkedHashMap<K, V> {
        private final int maxCapacity;

        public LRUCache(int maxCapacity) {
            super(maxCapacity + 1, 0.75f, true);
            this.maxCapacity = maxCapacity;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > maxCapacity;
        }
    }

    private final Map<String, Course> memoryCourseStore = Collections.synchronizedMap(new LRUCache<>(MAX_CACHE_COURSES));
    private final Map<String, Lesson> memoryLessonStore = Collections.synchronizedMap(new LRUCache<>(MAX_CACHE_LESSONS));

    public CourseService(GeminiService geminiService, @Autowired(required = false) YouTubeService youTubeService) {
        this.geminiService = geminiService;
        this.youTubeService = youTubeService;
    }

    @jakarta.annotation.PostConstruct
    public void normalizeExistingCoursesAndLessons() {
        if (courseRepository != null && mongoUri != null && !mongoUri.trim().isEmpty() && lessonRepository != null) {
            try {
                List<Course> courses = courseRepository.findAll();
                for (Course course : courses) {
                    String detectedLang = detectCourseLanguage(course.getTitle());
                    if (course.getModules() != null) {
                        for (Module m : course.getModules()) {
                            if (m.getLessons() != null) {
                                for (Lesson l : m.getLessons()) {
                                    if (l.isEnriched() && l.getContent() != null) {
                                        boolean modified = false;
                                        for (ContentBlock block : l.getContent()) {
                                            if ("code".equals(block.getType())) {
                                                if (block.getLanguage() == null || ("cpp".equalsIgnoreCase(block.getLanguage()) && !"cpp".equals(detectedLang))) {
                                                    block.setLanguage(detectedLang);
                                                    modified = true;
                                                }
                                            }
                                        }
                                        if (modified) {
                                            lessonRepository.save(l);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Could not auto-migrate existing lessons: " + e.getMessage());
            }
        }
    }

    private String detectCourseLanguage(String text) {
        if (text == null) return "javascript";
        String lower = text.toLowerCase();
        if (lower.contains("python") || lower.contains("py")) return "python";
        if (lower.contains("typescript") || lower.contains(" ts ")) return "typescript";
        if (lower.contains("javascript") || lower.contains(" js ") || lower.contains("react") || lower.contains("node")) return "javascript";
        if (lower.contains("java") && !lower.contains("javascript")) return "java";
        if (lower.contains("c++") || lower.contains("cpp")) return "cpp";
        if (lower.contains("c#") || lower.contains("csharp")) return "csharp";
        if (lower.contains("golang") || lower.contains(" go ")) return "go";
        if (lower.contains("rust")) return "rust";
        if (lower.contains("sql") || lower.contains("postgres") || lower.contains("mysql")) return "sql";
        return "javascript";
    }

    private void normalizeLessonCodeLanguage(String courseTitle, Lesson lesson) {
        if (lesson == null || lesson.getContent() == null) return;
        String lang = detectCourseLanguage(courseTitle + " " + lesson.getTitle());
        for (ContentBlock block : lesson.getContent()) {
            if ("code".equals(block.getType())) {
                if (block.getLanguage() == null || ("cpp".equalsIgnoreCase(block.getLanguage()) && !"cpp".equals(lang))) {
                    block.setLanguage(lang);
                }
            }
        }
    }

    public Course generateAndSaveCourse(String topic, String creator) {
        Course course = geminiService.generateCourseOutline(topic, creator);
        if (course.getId() == null || course.getId().isEmpty()) {
            course.setId(UUID.randomUUID().toString());
        }
        course.setCreatedAt(Instant.now());
        course.setUpdatedAt(Instant.now());

        if (course.getModules() != null) {
            for (Module m : course.getModules()) {
                if (m.getId() == null) m.setId(UUID.randomUUID().toString());
                if (m.getLessons() != null) {
                    for (Lesson l : m.getLessons()) {
                        if (l.getId() == null) l.setId(UUID.randomUUID().toString());
                        l.setCourseId(course.getId());
                        l.setModuleId(m.getId());
                    }
                }
            }
        }

        if (courseRepository != null && mongoUri != null && !mongoUri.trim().isEmpty()) {
            Course saved = courseRepository.save(course);
            if (saved.getModules() != null && lessonRepository != null) {
                for (Module m : saved.getModules()) {
                    if (m.getLessons() != null) {
                        for (Lesson l : m.getLessons()) {
                            lessonRepository.save(l);
                            memoryLessonStore.put(l.getId(), l);
                        }
                    }
                }
            }
            memoryCourseStore.put(saved.getId(), saved);
            return saved;
        }

        memoryCourseStore.put(course.getId(), course);
        if (course.getModules() != null) {
            for (Module m : course.getModules()) {
                if (m.getLessons() != null) {
                    for (Lesson l : m.getLessons()) {
                        memoryLessonStore.put(l.getId(), l);
                    }
                }
            }
        }
        return course;
    }

    private static final Set<String> INITIAL_COURSE_IDS = Set.of(
        "b5487d1b-886b-403d-9b80-ef58495f0b82",
        "b968ee0d-86eb-4c19-b64c-6a10239690da"
    );

    public List<Course> getAllCourses(String currentUser) {
        List<Course> all = new ArrayList<>();
        if (courseRepository != null && mongoUri != null && !mongoUri.trim().isEmpty()) {
            try {
                List<Course> dbList = courseRepository.findAllByOrderByCreatedAtDesc();
                if (dbList != null && !dbList.isEmpty()) {
                    all = dbList;
                }
            } catch (Exception e) {
                System.err.println("MongoDB getAllCourses failed: " + e.getMessage());
            }
        }
        if (all.isEmpty()) {
            all = new ArrayList<>(memoryCourseStore.values());
            all.sort((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
        }

        String userClean = (currentUser != null) ? currentUser.trim().toLowerCase() : "";

        List<Course> visible = new ArrayList<>();
        for (Course c : all) {
            if (c.getId() != null && INITIAL_COURSE_IDS.contains(c.getId())) {
                visible.add(c);
                continue;
            }
            String creator = c.getCreator();
            if (creator != null && "SYSTEM".equalsIgnoreCase(creator)) {
                visible.add(c);
                continue;
            }
            if (!userClean.isEmpty() && creator != null && !creator.trim().isEmpty() && !"anonymous".equalsIgnoreCase(creator)) {
                if ("operator@text-to-learn.ai".equals(userClean) ||
                    creator.equalsIgnoreCase(userClean) ||
                    userClean.contains(creator.toLowerCase()) ||
                    creator.toLowerCase().contains(userClean)) {
                    visible.add(c);
                }
            }
        }
        return visible;
    }

    public List<Course> getAllCourses() {
        return getAllCourses(null);
    }

    public Optional<Course> getCourseById(String id) {
        Course cached = memoryCourseStore.get(id);
        if (cached != null) {
            return Optional.of(cached);
        }
        if (courseRepository != null && mongoUri != null && !mongoUri.trim().isEmpty()) {
            try {
                Optional<Course> opt = courseRepository.findById(id);
                if (opt.isPresent()) {
                    memoryCourseStore.put(id, opt.get());
                    return opt;
                }
            } catch (Exception ignored) {}
        }
        return Optional.empty();
    }

    public boolean isCourseAccessible(Course course, String currentUser) {
        // System.out.println("Current User:: " + currentUser);
        // System.out.println("Creator User:: " + course.getCreator());
        if (course == null) return false;
        if (course.getId() != null && INITIAL_COURSE_IDS.contains(course.getId())) {
            return true;
        }
        String creator = course.getCreator();
        if (creator != null && "SYSTEM".equalsIgnoreCase(creator)) {
            return true;
        }
        if (currentUser == null || currentUser.trim().isEmpty() || "anonymous".equalsIgnoreCase(currentUser.trim())) {
            return false;
        }
        if (creator == null || creator.trim().isEmpty() || "anonymous".equalsIgnoreCase(creator)) {
            return false;
        }
        String userClean = currentUser.trim().toLowerCase();
        String creatorClean = creator.trim().toLowerCase();
        if (creatorClean.equals(userClean)) {
            return true;
        }
        return creatorClean.equals(userClean) || userClean.contains(creatorClean) || creatorClean.contains(userClean);
    }

    public List<Course> getUserCourses(String creator) {
        if (courseRepository != null && mongoUri != null && !mongoUri.trim().isEmpty()) {
            try {
                return courseRepository.findByCreator(creator);
            } catch (Exception ignored) {}
        }
        List<Course> list = new ArrayList<>();
        for (Course c : memoryCourseStore.values()) {
            if (creator.equals(c.getCreator())) {
                list.add(c);
            }
        }
        return list;
    }

    public Lesson getOrGenerateLesson(String courseId, String moduleId, String lessonId) {
        Lesson cached = memoryLessonStore.get(lessonId);

        String courseTitle = "Course";
        String moduleTitle = "Module";
        Course course = memoryCourseStore.get(courseId);

        if (course != null) {
            courseTitle = course.getTitle();
            if (course.getModules() != null) {
                for (Module m : course.getModules()) {
                    if (m.getId().equals(moduleId)) {
                        moduleTitle = m.getTitle();
                        break;
                    }
                }
            }
        }

        if (cached != null && cached.isEnriched()) {
            normalizeLessonCodeLanguage(courseTitle, cached);
            return cached;
        }

        if (lessonRepository != null && mongoUri != null && !mongoUri.trim().isEmpty()) {
            try {
                Optional<Lesson> dbOpt = lessonRepository.findById(lessonId);
                if (dbOpt.isPresent() && dbOpt.get().isEnriched()) {
                    Lesson dbLesson = dbOpt.get();
                    normalizeLessonCodeLanguage(courseTitle, dbLesson);
                    memoryLessonStore.put(lessonId, dbLesson);
                    return dbLesson;
                }
            } catch (Exception ignored) {}
        }

        String lessonTitle = (cached != null && cached.getTitle() != null) ? cached.getTitle() : "Lesson Details";
        List<String> previousLessons = new ArrayList<>();
        List<String> nextLessons = new ArrayList<>();

        if (course != null && course.getModules() != null) {
            boolean foundCurrent = false;
            for (Module m : course.getModules()) {
                if (m.getLessons() != null) {
                    for (Lesson l : m.getLessons()) {
                        if (l.getId() != null && l.getId().equals(lessonId)) {
                            foundCurrent = true;
                            if (l.getTitle() != null) {
                                lessonTitle = l.getTitle();
                            }
                        } else if (!foundCurrent) {
                            if (l.getTitle() != null) {
                                previousLessons.add(l.getTitle());
                            }
                        } else {
                            if (l.getTitle() != null) {
                                nextLessons.add(l.getTitle());
                            }
                        }
                    }
                }
            }
        }

        Lesson enriched = geminiService.generateLessonContent(courseTitle, moduleTitle, previousLessons, lessonTitle, nextLessons);
        enriched.setId(lessonId);
        enriched.setCourseId(courseId);
        enriched.setModuleId(moduleId);
        enriched.setEnriched(true);

        if (enriched.getContent() != null && youTubeService != null) {
            Iterator<ContentBlock> it = enriched.getContent().iterator();
            while (it.hasNext()) {
                ContentBlock block = it.next();
                if ("video".equals(block.getType())) {
                    String query = block.getQuery();
                    if (query == null || query.trim().isEmpty()) {
                        query = lessonTitle + " tutorial";
                    }
                    Map<String, String> bestVideo = youTubeService.findBestVideo(
                        query,
                        lessonTitle,
                        courseTitle,
                        "BEGINNER",
                        block.getRequiredKeywords(),
                        geminiService
                    );

                    if (bestVideo != null && bestVideo.containsKey("videoId") && !bestVideo.get("videoId").isEmpty()) {
                        block.setVideoId(bestVideo.get("videoId"));
                        block.setVideoTitle(bestVideo.get("title"));
                        block.setVideoThumbnail(bestVideo.get("thumbnail"));
                        block.setUrl(bestVideo.get("embedUrl"));
                    } else {
                        block.setUrl(null);
                        block.setVideoId(null);
                    }
                }
            }
        }

        if (lessonRepository != null && mongoUri != null && !mongoUri.trim().isEmpty()) {
            try {
                enriched = lessonRepository.save(enriched);
            } catch (Exception e) {
                System.err.println("Error saving lesson to MongoDB: " + e.getMessage());
            }
        }

        memoryLessonStore.put(lessonId, enriched);
        return enriched;
    }

    public String translateLessonToHinglish(String lessonId) {
        Lesson lesson = memoryLessonStore.get(lessonId);

        if (lesson != null) {
            if (lesson.getHinglishExplanation() != null && !lesson.getHinglishExplanation().isEmpty()) {
                return lesson.getHinglishExplanation();
            }
            StringBuilder sb = new StringBuilder();
            sb.append("Lesson: ").append(lesson.getTitle()).append("\n");
            if (lesson.getContent() != null) {
                for (var block : lesson.getContent()) {
                    if (block.getText() != null) {
                        sb.append(block.getText()).append("\n");
                    }
                }
            }
            String hinglish = geminiService.generateHinglishExplanation(sb.toString());
            lesson.setHinglishExplanation(hinglish);
            memoryLessonStore.put(lessonId, lesson);
            return hinglish;
        }
        return "Is lesson mein concepts ko beginner se advanced level tak cover kiya gaya hai.";
    }

    public boolean deleteCourse(String id) {
        memoryCourseStore.remove(id);
        if (courseRepository != null) {
            try {
                courseRepository.deleteById(id);
                return true;
            } catch (Exception e) {
                System.err.println("Error deleting course: " + e.getMessage());
            }
        }
        return true;
    }

    public int cleanupOldCourses(int keepCount) {
        List<Course> all = getAllCourses();
        if (all.size() <= keepCount) {
            return 0;
        }

        int deletedCount = 0;
        for (int i = keepCount; i < all.size(); i++) {
            Course c = all.get(i);
            deleteCourse(c.getId());
            deletedCount++;
        }
        return deletedCount;
    }

    public void clearCache() {
        memoryCourseStore.clear();
        memoryLessonStore.clear();
    }
}
