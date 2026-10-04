package com.texttolearn.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.texttolearn.model.ContentBlock;
import com.texttolearn.model.Course;
import com.texttolearn.model.Lesson;
import com.texttolearn.model.Module;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String[] CANDIDATE_MODELS = {
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-3.8-flash"
    };

    public Course generateCourseOutline(String topic, String creator) {
        String safeTopic = sanitizeTopic(topic);

        String prompt = String.format(
            "You are an expert technical educator and curriculum designer.\n\n" +
            "Your task is to create a structured learning course for the user's topic.\n\n" +
            "USER TOPIC:\n" +
            "%s\n\n" +
            "CORE EDUCATIONAL PRINCIPLE:\n" +
            "Teach the topic progressively from beginner fundamentals to advanced concepts. " +
            "The course must remain tightly focused on the user's topic.\n\n" +
            "IMPORTANT RULES:\n\n" +
            "1. STAY STRICTLY WITHIN THE USER'S TOPIC\n" +
            "- Every module and lesson must directly contribute to understanding the requested topic.\n" +
            "- Do not introduce unrelated technologies, architectures, operating-system internals, " +
            "hardware concepts, distributed systems, or advanced implementation details unless they " +
            "are genuinely necessary for the requested topic.\n" +
            "- Being technically related is NOT enough. A concept must be relevant to the learner's " +
            "current stage and the current topic.\n" +
            "- Never turn a simple programming topic into a systems-engineering course.\n\n" +
            "2. START FROM BEGINNER LEVEL\n" +
            "The first module must assume that the learner has little or no prior knowledge of the topic.\n" +
            "Start with:\n" +
            "- What the concept is\n" +
            "- Why it is used\n" +
            "- Basic terminology\n" +
            "- Basic syntax or structure when applicable\n" +
            "- Very simple examples\n" +
            "- Fundamental operations\n\n" +
            "3. FOLLOW A NATURAL LEARNING PROGRESSION\n" +
            "Use this general progression when applicable:\n\n" +
            "BEGINNER FUNDAMENTALS\n" +
            "-> CORE CONCEPTS\n" +
            "-> GUIDED PRACTICE\n" +
            "-> INTERMEDIATE CONCEPTS\n" +
            "-> PROBLEM-SOLVING PATTERNS\n" +
            "-> ADVANCED CONCEPTS\n" +
            "-> REAL-WORLD APPLICATIONS\n\n" +
            "Do not skip directly from fundamentals to advanced internals.\n\n" +
            "4. DO NOT OVER-ENGINEER SIMPLE TOPICS\n" +
            "For example, if the topic is 'Arrays in C++', early lessons should focus on:\n" +
            "- What an array is\n" +
            "- Why arrays are used\n" +
            "- Declaring arrays\n" +
            "- Initializing arrays\n" +
            "- Indexing\n" +
            "- Accessing elements\n" +
            "- Updating elements\n" +
            "- Traversing arrays\n" +
            "- Taking input\n" +
            "- Printing elements\n" +
            "- Simple operations such as sum, minimum, maximum and searching\n\n" +
            "Do NOT begin an Arrays course with:\n" +
            "- CPU cache architecture\n" +
            "- Hardware prefetchers\n" +
            "- x86 registers\n" +
            "- Stack pointer internals\n" +
            "- Kernel memory allocation\n" +
            "- Real-time systems\n" +
            "- Compiler internals\n" +
            "- Memory allocator implementation\n\n" +
            "Such topics may appear much later only if they are genuinely useful to the requested topic.\n\n" +
            "5. TOPIC COMPLEXITY MUST DETERMINE COURSE DEPTH\n" +
            "Do not artificially make every course highly advanced.\n" +
            "A simple topic should have a simple and focused learning path.\n" +
            "A complex topic may naturally require advanced architecture, optimization, or design concepts.\n\n" +
            "6. RESPECT PREREQUISITES\n" +
            "A learner should never need knowledge from a later lesson to understand an earlier lesson.\n" +
            "Introduce prerequisites before concepts that depend on them.\n\n" +
            "7. USE PRACTICAL EXAMPLES\n" +
            "Examples should match the learner's current stage.\n" +
            "Beginner lessons should use small, understandable examples.\n" +
            "Intermediate lessons can introduce realistic problems.\n" +
            "Advanced lessons can introduce optimization and real-world applications when appropriate.\n\n" +
            "8. DO NOT ARTIFICIALLY ADD ADVANCED MODULES\n" +
            "Do not create a module called 'Advanced Architecture' simply because the topic is technical.\n" +
            "Only create advanced modules if the topic naturally contains advanced concepts.\n\n" +
            "9. LESSON TITLES MUST BE SPECIFIC\n" +
            "Bad:\n" +
            "- Advanced Concepts\n" +
            "- Deep Dive\n" +
            "- Architecture\n" +
            "- Internals\n\n" +
            "Good:\n" +
            "- Declaring and Initializing Arrays in C++\n" +
            "- Accessing Array Elements Using Indexes\n" +
            "- Traversing Arrays Using Loops\n" +
            "- Finding the Maximum Element in an Array\n" +
            "- Passing Arrays to Functions\n\n" +
            "10. KEEP THE COURSE COHERENT\n" +
            "The course should feel like one continuous learning journey.\n" +
            "Each lesson should naturally build upon previous lessons.\n\n" +
            "11. COURSE SIZE\n" +
            "Create approximately 4-7 modules depending on the natural complexity of the topic.\n" +
            "Each module should contain approximately 3-6 lessons.\n" +
            "Do not add lessons merely to increase course length.\n\n" +
            "12. FINAL QUALITY CHECK\n" +
            "Before returning the course, internally verify:\n" +
            "- Is every lesson directly related to the user's topic?\n" +
            "- Does the course begin at beginner level?\n" +
            "- Are prerequisites introduced before dependent concepts?\n" +
            "- Are advanced concepts delayed until fundamentals are covered?\n" +
            "- Have unrelated concepts been removed?\n" +
            "- Would a beginner realistically be able to follow the course?\n\n" +
            "Return ONLY a valid JSON object. No markdown. No backticks. No explanation outside JSON.\n\n" +
            "Use exactly this schema:\n" +
            "{\n" +
            "  \"title\": \"Descriptive course title\",\n" +
            "  \"description\": \"2-3 sentence description explaining what the learner will learn and how the course progresses.\",\n" +
            "  \"tags\": [\"RelevantTag1\", \"RelevantTag2\", \"RelevantTag3\", \"RelevantTag4\"],\n" +
            "  \"modules\": [\n" +
            "    {\n" +
            "      \"title\": \"Module 1: Specific Beginner Topic\",\n" +
            "      \"lessons\": [\n" +
            "        {\"title\": \"1.1 Specific Lesson\"},\n" +
            "        {\"title\": \"1.2 Specific Lesson\"},\n" +
            "        {\"title\": \"1.3 Specific Lesson\"}\n" +
            "      ]\n" +
            "    },\n" +
            "    {\n" +
            "      \"title\": \"Module 2: Core Concepts\",\n" +
            "      \"lessons\": [\n" +
            "        {\"title\": \"2.1 Specific Lesson\"},\n" +
            "        {\"title\": \"2.2 Specific Lesson\"},\n" +
            "        {\"title\": \"2.3 Specific Lesson\"}\n" +
            "      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}\n",
            safeTopic
        );

        try {
            String rawResponse = callGemini(prompt);
            if (rawResponse != null && !rawResponse.isEmpty()) {
                String cleanJson = cleanJson(rawResponse);
                JsonNode root = objectMapper.readTree(cleanJson);

                Course course = new Course();
                course.setTitle(root.path("title").asText(safeTopic + " Fundamentals"));
                course.setDescription(root.path("description").asText(
                    "A step-by-step learning course covering the fundamentals, practical concepts, and applications of " + safeTopic + "."
                ));
                course.setCreator((creator != null && !creator.isEmpty()) ? creator : "anonymous");

                List<String> tags = new ArrayList<>();
                if (root.has("tags") && root.get("tags").isArray()) {
                    root.get("tags").forEach(t -> tags.add(t.asText()));
                } else {
                    tags.add(safeTopic);
                    tags.add("Learning");
                    tags.add("Programming");
                    tags.add("Tutorial");
                }
                course.setTags(tags);

                List<Module> modules = new ArrayList<>();
                if (root.has("modules") && root.get("modules").isArray()) {
                    int modOrder = 0;
                    for (JsonNode modNode : root.get("modules")) {
                        Module mod = new Module();
                        mod.setTitle(modNode.path("title").asText("Module " + (modOrder + 1)));
                        mod.setOrder(modOrder++);

                        List<Lesson> lessons = new ArrayList<>();
                        if (modNode.has("lessons") && modNode.get("lessons").isArray()) {
                            for (JsonNode lNode : modNode.get("lessons")) {
                                Lesson lesson = new Lesson();
                                lesson.setTitle(lNode.path("title").asText("Lesson"));
                                lesson.setObjectives(new ArrayList<>());
                                lesson.setContent(new ArrayList<>());
                                lesson.setEnriched(false);
                                lessons.add(lesson);
                            }
                        }
                        mod.setLessons(lessons);
                        modules.add(mod);
                    }
                }
                course.setModules(modules);
                return course;
            }
        } catch (Exception e) {
            System.err.println("Gemini Course Generation Error. Falling back to template engine: " + e.getMessage());
        }

        return generateFallbackCourse(safeTopic, creator);
    }

    public Lesson generateLessonContent(
        String courseTitle,
        String moduleTitle,
        String lessonTitle
    ) {
        return generateLessonContent(courseTitle, moduleTitle, Collections.emptyList(), lessonTitle, Collections.emptyList());
    }

    public Lesson generateLessonContent(
        String courseTitle,
        String moduleTitle,
        List<String> previousLessons,
        String lessonTitle,
        List<String> nextLessons
    ) {
        String safeCourse = sanitizeTopic(courseTitle);
        String safeModule = sanitizeTopic(moduleTitle);
        String safeLesson = sanitizeTopic(lessonTitle);

        String learnerLevel = inferLevel(safeModule, safeLesson);

        StringBuilder contextSection = new StringBuilder();
        if (previousLessons != null && !previousLessons.isEmpty()) {
            contextSection.append("PREVIOUS LESSONS ALREADY COVERED:\n");
            for (String pl : previousLessons) {
                contextSection.append("- ").append(pl).append("\n");
            }
            contextSection.append("(Rule: Build upon these, but do not repeat their basic definitions from scratch.)\n\n");
        }

        if (nextLessons != null && !nextLessons.isEmpty()) {
            contextSection.append("UPCOMING FUTURE LESSONS:\n");
            for (String nl : nextLessons) {
                contextSection.append("- ").append(nl).append("\n");
            }
            contextSection.append("(Rule: Do NOT teach these topics now; they belong to future lessons.)\n\n");
        }

        String prompt = String.format(
            "You are an expert programming instructor and technical educator.\n\n" +
            "Generate ONE complete, focused lesson for the course information below.\n\n" +
            "COURSE:\n%s\n\n" +
            "MODULE:\n%s\n\n" +
            "CURRENT LESSON:\n%s\n\n" +
            "%s" +
            "LEARNER LEVEL:\n%s\n\n" +
            "IMPORTANT RULE: TEACH THE CURRENT LESSON ONLY.\n\n" +
            "The lesson must be tightly focused on the current lesson title.\n" +
            "Do not use the lesson as an excuse to teach unrelated advanced concepts or future lessons.\n\n" +
            "LEARNING LEVEL RULES:\n\n" +
            "BEGINNER:\n" +
            "- Assume little or no prior knowledge.\n" +
            "- Explain terminology before using it.\n" +
            "- Use simple, understandable examples.\n" +
            "- Avoid unnecessary jargon.\n" +
            "- Prefer short runnable code.\n" +
            "- Focus on intuition before technical details.\n\n" +
            "INTERMEDIATE:\n" +
            "- Assume the learner understands the fundamentals.\n" +
            "- Introduce practical patterns and realistic examples.\n" +
            "- Discuss common mistakes and edge cases.\n" +
            "- Introduce efficiency when relevant.\n\n" +
            "ADVANCED:\n" +
            "- Assume strong understanding of fundamentals.\n" +
            "- Discuss advanced techniques, architecture, and trade-offs only when directly relevant to this specific topic.\n\n" +
            "CONTENT RULES:\n" +
            "1. Provide exactly 3 clear learning objectives specific to '%s'.\n" +
            "2. Explain the concept progressively and keep the explanation appropriate for the learner level.\n" +
            "3. Programming examples must directly demonstrate the current lesson with clean, runnable code.\n" +
            "4. Keep code focused and choose the natural programming language for the topic.\n" +
            "5. VIDEO RECOMMENDATION RULES (CRITICAL):\n" +
            "   - Do NEVER invent, hallucinate, or return a YouTube video ID, watch URL, or embed URL.\n" +
            "   - Provide ONLY a concise, highly specific YouTube search query combining the programming language, topic, and exact concept (e.g. 'C++ declare array syntax beginner tutorial').\n" +
            "   - Provide 3-5 'requiredKeywords' that the video MUST cover (e.g. [\"C++\", \"array\", \"declaration\", \"syntax\"]).\n" +
            "6. Create 3-4 Multiple Choice Questions (MCQs) testing concepts taught in THIS lesson. Each question must have 4 options, a 0-indexed correct answer, and an explanation.\n\n" +
            "Return ONLY valid JSON. No markdown. No code fences. No text outside JSON.\n\n" +
            "{\n" +
            "  \"objectives\": [\n" +
            "    \"Objective 1\",\n" +
            "    \"Objective 2\",\n" +
            "    \"Objective 3\"\n" +
            "  ],\n" +
            "  \"content\": [\n" +
            "    {\"type\": \"heading\", \"text\": \"Lesson Introduction: %s\"},\n" +
            "    {\"type\": \"paragraph\", \"text\": \"Clear, step-by-step conceptual explanation tailored to the learner level...\"},\n" +
            "    {\"type\": \"heading\", \"text\": \"How It Works & Practical Demonstration\"},\n" +
            "    {\"type\": \"paragraph\", \"text\": \"Detailed breakdown of syntax, behavior, and mental model...\"},\n" +
            "    {\"type\": \"code\", \"language\": \"cpp\", \"text\": \"// Runnable, focused code directly demonstrating the lesson\"},\n" +
            "    {\"type\": \"paragraph\", \"text\": \"Explanation of the code and expected behavior...\"},\n" +
            "    {\"type\": \"heading\", \"text\": \"Common Mistakes & Best Practices\"},\n" +
            "    {\"type\": \"paragraph\", \"text\": \"Common mistakes learners should avoid and tips for clean usage...\"},\n" +
            "    {\"type\": \"video\", \"query\": \"%s tutorial\", \"requiredKeywords\": [\"Keyword1\", \"Keyword2\", \"Keyword3\"]},\n" +
            "    {\"type\": \"mcq\", \"question\": \"Question based directly on this lesson?\", \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"], \"answer\": 0, \"explanation\": \"Why Option A is correct.\"}\n" +
            "  ]\n" +
            "}\n",
            safeCourse,
            safeModule,
            safeLesson,
            contextSection.toString(),
            learnerLevel,
            safeLesson,
            safeLesson,
            safeLesson
        );

        try {
            String rawResponse = callGemini(prompt);
            if (rawResponse != null && !rawResponse.isEmpty()) {
                String cleanJson = cleanJson(rawResponse);
                JsonNode root = objectMapper.readTree(cleanJson);

                Lesson lesson = new Lesson();
                lesson.setTitle(lessonTitle);

                List<String> objectives = new ArrayList<>();
                if (root.has("objectives") && root.get("objectives").isArray()) {
                    root.get("objectives").forEach(obj -> objectives.add(obj.asText()));
                }
                lesson.setObjectives(objectives);

                List<ContentBlock> blocks = new ArrayList<>();
                if (root.has("content") && root.get("content").isArray()) {
                    for (JsonNode b : root.get("content")) {
                        ContentBlock cb = new ContentBlock();
                        cb.setType(b.path("type").asText("paragraph"));
                        cb.setText(b.path("text").asText(null));
                        cb.setLanguage(b.path("language").asText(null));
                        cb.setQuery(b.path("query").asText(null));
                        cb.setUrl(null);
                        cb.setVideoId(null);
                        cb.setQuestion(b.path("question").asText(null));
                        cb.setExplanation(b.path("explanation").asText(null));

                        if (b.has("requiredKeywords") && b.get("requiredKeywords").isArray()) {
                            List<String> kws = new ArrayList<>();
                            b.get("requiredKeywords").forEach(kw -> kws.add(kw.asText()));
                            cb.setRequiredKeywords(kws);
                        }

                        if (b.has("answer") && !b.get("answer").isNull()) {
                            cb.setAnswer(b.get("answer").asInt(0));
                        }
                        if (b.has("options") && b.get("options").isArray()) {
                            List<String> options = new ArrayList<>();
                            b.get("options").forEach(option -> options.add(option.asText()));
                            cb.setOptions(options);
                        }
                        blocks.add(cb);
                    }
                }
                lesson.setContent(blocks);
                lesson.setEnriched(true);
                return lesson;
            }
        } catch (Exception e) {
            System.err.println("Gemini Lesson Generation Error. Fallback used: " + e.getMessage());
        }

        return generateFallbackLesson(safeCourse, safeModule, safeLesson);
    }

    public int evaluateVideoCandidates(
        String courseTitle,
        String lessonTitle,
        String learnerLevel,
        List<String> requiredKeywords,
        List<Map<String, String>> candidates
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return -1;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("You are an educational video evaluator. Evaluate candidate YouTube videos to see if any genuinely teach the lesson topic.\n\n");
        sb.append("LESSON TOPIC: ").append(lessonTitle).append("\n");
        sb.append("COURSE: ").append(courseTitle).append("\n");
        sb.append("LEARNER LEVEL: ").append(learnerLevel).append("\n");
        if (requiredKeywords != null && !requiredKeywords.isEmpty()) {
            sb.append("REQUIRED CONCEPTS: ").append(String.join(", ", requiredKeywords)).append("\n");
        }
        sb.append("\nCANDIDATE VIDEOS:\n");

        for (int i = 0; i < candidates.size(); i++) {
            Map<String, String> c = candidates.get(i);
            sb.append(i).append(". Title: \"").append(c.get("title")).append("\"\n");
            sb.append("   Description: \"").append(c.get("description")).append("\"\n\n");
        }

        sb.append("EVALUATION RULES:\n");
        sb.append("1. A candidate is relevant ONLY if it directly teaches the specified lesson topic and language/technology.\n");
        sb.append("2. Obvious mismatches (e.g. wrong programming language, unrelated domain, video game, clickbait) MUST receive a low score (< 5).\n");
        sb.append("3. If no candidate reaches a relevance score of at least 7, set 'selectedIndex' to -1.\n\n");
        sb.append("Return ONLY a JSON object: {\"selectedIndex\": 0, \"relevanceScore\": 8, \"reason\": \"Directly covers the concept.\"}\n");

        try {
            String response = callGemini(sb.toString());
            if (response != null && !response.isEmpty()) {
                String clean = cleanJson(response);
                JsonNode root = objectMapper.readTree(clean);
                int selectedIndex = root.path("selectedIndex").asInt(-1);
                int score = root.path("relevanceScore").asInt(0);

                if (score >= 7 && selectedIndex >= 0 && selectedIndex < candidates.size()) {
                    return selectedIndex;
                }
            }
        } catch (Exception e) {
            System.err.println("Video Semantic Evaluation Error: " + e.getMessage());
        }

        return -1;
    }

    public String generateHinglishExplanation(String englishText) {
        String prompt =
            "You are a friendly Indian technical instructor.\n\n" +
            "Explain the following technical lesson in natural conversational Hinglish " +
            "(Hindi + English) so that an Indian student can easily understand the intuition.\n\n" +
            "Rules:\n" +
            "- Keep technical keywords in English.\n" +
            "- Do not translate programming keywords.\n" +
            "- Use simple Roman Hindi.\n" +
            "- Give intuitive explanations.\n" +
            "- Do not introduce concepts that are not present in the original lesson.\n" +
            "- Do not make the explanation unnecessarily advanced.\n\n" +
            "LESSON:\n\n" +
            englishText;

        try {
            String response = callGemini(prompt);
            if (response != null && !response.trim().isEmpty()) {
                return response.trim();
            }
        } catch (Exception e) {
            System.err.println("Gemini Hinglish Error: " + e.getMessage());
        }

        return "Is lesson mein concepts ko simple way mein explain kiya gaya hai. " +
               "Examples aur practice ke through aap is concept ko gradually samajh sakte hain.";
    }

    private String callGemini(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return null;
        }

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> payload = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        for (String model : CANDIDATE_MODELS) {
            String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                model,
                apiKey
            );

            try {
                ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && candidates.size() > 0) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && parts.size() > 0) {
                            return parts.get(0).path("text").asText();
                        }
                    }
                }
            } catch (Exception ignored) {

            }
        }

        return null;
    }

    private String cleanJson(String raw) {
        if (raw == null) {
            return "";
        }

        String clean = raw.trim();

        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }

        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }

        clean = clean.trim();

        int firstBrace = clean.indexOf('{');
        int lastBrace = clean.lastIndexOf('}');

        if (firstBrace >= 0 && lastBrace > firstBrace) {
            clean = clean.substring(firstBrace, lastBrace + 1);
        }

        return clean.trim();
    }

    private String inferLevel(String moduleTitle, String lessonTitle) {
        String text = (moduleTitle + " " + lessonTitle).toLowerCase();

        String[] beginnerWords = {
            "introduction", "intro", "basics", "basic", "fundamentals", "what is",
            "getting started", "declaration", "initialization", "syntax", "terminology",
            "first", "beginner", "simple", "creating", "accessing", "indexing", "traversing"
        };

        for (String word : beginnerWords) {
            if (text.contains(word)) {
                return "BEGINNER";
            }
        }

        String[] advancedWords = {
            "advanced", "optimization", "performance", "internals", "architecture",
            "concurrency", "scalability", "memory model", "low level", "compiler",
            "production", "distributed", "advanced patterns"
        };

        for (String word : advancedWords) {
            if (text.contains(word)) {
                return "ADVANCED";
            }
        }

        return "INTERMEDIATE";
    }

    private String sanitizeTopic(String topic) {
        if (topic == null || topic.trim().isEmpty()) {
            return "Programming Fundamentals";
        }

        String cleaned = topic.trim().replace("\u0000", "").replaceAll("\\s+", " ");
        if (cleaned.length() > 500) {
            cleaned = cleaned.substring(0, 500);
        }
        return cleaned;
    }

    private Course generateFallbackCourse(String topic, String creator) {
        Course course = new Course();
        course.setTitle(topic + " - Beginner to Advanced");
        course.setDescription(
            "A structured learning path for " + topic +
            " that starts with fundamentals, builds practical understanding, " +
            "and gradually introduces more advanced concepts."
        );
        course.setCreator((creator != null && !creator.isEmpty()) ? creator : "anonymous");
        course.setTags(Arrays.asList(topic, "Learning", "Tutorial", "AI-Generated"));

        List<Module> modules = new ArrayList<>();
        String[] moduleTitles = {
            "Foundations of " + topic,
            "Core Concepts of " + topic,
            "Practical " + topic,
            "Intermediate " + topic,
            "Advanced " + topic
        };

        for (int i = 0; i < moduleTitles.length; i++) {
            Module module = new Module();
            module.setTitle("Module " + (i + 1) + ": " + moduleTitles[i]);
            module.setOrder(i);

            List<Lesson> lessons = new ArrayList<>();
            if (i == 0) {
                lessons.add(createBasicLesson("1.1 Introduction to " + topic, "Understand what " + topic + " is and why it is used."));
                lessons.add(createBasicLesson("1.2 Core Terminology", "Learn the basic terminology and concepts used in " + topic + "."));
                lessons.add(createBasicLesson("1.3 Getting Started with " + topic, "Perform the first basic operations related to " + topic + "."));
            } else if (i == 1) {
                lessons.add(createBasicLesson("2.1 Core Concepts", "Understand the fundamental concepts of " + topic + "."));
                lessons.add(createBasicLesson("2.2 Common Operations", "Learn the most common operations and patterns."));
                lessons.add(createBasicLesson("2.3 Common Mistakes", "Identify and avoid common beginner mistakes."));
            } else if (i == 2) {
                lessons.add(createBasicLesson("3.1 Practical Examples", "Apply the concepts using practical examples."));
                lessons.add(createBasicLesson("3.2 Solving Problems", "Use the concepts to solve common problems."));
                lessons.add(createBasicLesson("3.3 Practice and Edge Cases", "Handle common edge cases and practical scenarios."));
            } else if (i == 3) {
                lessons.add(createBasicLesson("4.1 Intermediate Techniques", "Apply intermediate techniques related to " + topic + "."));
                lessons.add(createBasicLesson("4.2 Combining Concepts", "Combine multiple concepts to solve more realistic problems."));
                lessons.add(createBasicLesson("4.3 Efficiency and Best Practices", "Understand relevant efficiency considerations and best practices."));
            } else {
                lessons.add(createBasicLesson("5.1 Advanced Concepts", "Explore advanced concepts directly related to " + topic + "."));
                lessons.add(createBasicLesson("5.2 Advanced Problem Solving", "Apply advanced techniques to challenging problems."));
            }

            module.setLessons(lessons);
            modules.add(module);
        }

        course.setModules(modules);
        return course;
    }

    private Lesson createBasicLesson(String title, String objective) {
        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setObjectives(Collections.singletonList(objective));
        lesson.setContent(new ArrayList<>());
        lesson.setEnriched(false);
        return lesson;
    }

    private Lesson generateFallbackLesson(String courseTitle, String moduleTitle, String lessonTitle) {
        Lesson lesson = new Lesson();
        lesson.setTitle(lessonTitle);
        lesson.setObjectives(Arrays.asList(
            "Understand the main idea behind " + lessonTitle,
            "Apply the concept using a simple practical example",
            "Identify common mistakes related to this concept"
        ));

        List<ContentBlock> blocks = new ArrayList<>();
        blocks.add(ContentBlock.builder().type("heading").text("Introduction").build());
        blocks.add(ContentBlock.builder().type("paragraph").text(
            lessonTitle + " is an important concept in " + courseTitle +
            ". This lesson focuses on understanding the idea step by step before moving to more advanced concepts."
        ).build());

        blocks.add(ContentBlock.builder().type("heading").text("Core Concept").build());
        blocks.add(ContentBlock.builder().type("paragraph").text(
            "Start by understanding the basic idea of " + lessonTitle +
            ". Once the basic concept is clear, it becomes easier to apply it to practical problems."
        ).build());

        blocks.add(ContentBlock.builder().type("code").language("cpp").text(
            "// Simple example demonstrating " + lessonTitle + "\n" +
            "int main() {\n" +
            "    // Implementation\n" +
            "    return 0;\n" +
            "}"
        ).build());

        blocks.add(ContentBlock.builder().type("heading").text("Common Mistakes").build());
        blocks.add(ContentBlock.builder().type("paragraph").text(
            "A common mistake is trying to use advanced techniques before understanding the basic concept. " +
            "Focus on the fundamentals first and then gradually move to more complex cases."
        ).build());

        blocks.add(ContentBlock.builder().type("video").query(lessonTitle + " beginner tutorial").build());

        blocks.add(ContentBlock.builder()
            .type("mcq")
            .question("What is the main purpose of learning " + lessonTitle + "?")
            .options(Arrays.asList(
                "To understand and apply the concept correctly",
                "To make programs unnecessarily complicated",
                "To avoid learning the fundamentals",
                "To replace all other programming concepts"
            ))
            .answer(0)
            .explanation("The main purpose is to understand the concept and apply it correctly in practical situations.")
            .build());

        lesson.setContent(blocks);
        lesson.setEnriched(true);
        return lesson;
    }
}
