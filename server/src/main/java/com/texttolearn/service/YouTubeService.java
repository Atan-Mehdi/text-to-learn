package com.texttolearn.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class YouTubeService {

    @Value("${youtube.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, String> findBestVideo(
            String query,
            String lessonTitle,
            String courseTitle,
            String learnerLevel,
            List<String> requiredKeywords,
            GeminiService geminiService
    ) {
        Map<String, String> result = new HashMap<>();

        if (apiKey == null || apiKey.trim().isEmpty() || query == null || query.trim().isEmpty()) {
            return result;
        }

        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = String.format(
                "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=relevance&videoEmbeddable=true&maxResults=6&q=%s&key=%s",
                encodedQuery, apiKey
            );

            String response = restTemplate.getForObject(url, String.class);
            if (response == null || response.isEmpty()) {
                return result;
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode items = root.path("items");
            if (!items.isArray() || items.size() == 0) {
                return result;
            }

            List<Map<String, String>> candidates = new ArrayList<>();
            for (JsonNode item : items) {
                String videoId = item.path("id").path("videoId").asText("");
                String title = item.path("snippet").path("title").asText("");
                String description = item.path("snippet").path("description").asText("");
                String thumbnail = item.path("snippet").path("thumbnails").path("medium").path("url").asText("");

                if (!videoId.isEmpty() && !title.isEmpty()) {
                    Map<String, String> candidate = new HashMap<>();
                    candidate.put("videoId", videoId);
                    candidate.put("title", title);
                    candidate.put("description", description);
                    candidate.put("thumbnail", thumbnail);
                    candidate.put("embedUrl", "https://www.youtube.com/embed/" + videoId);
                    candidates.add(candidate);
                }
            }

            if (candidates.isEmpty()) {
                return result;
            }

            List<Map<String, String>> filteredCandidates = filterObviousMismatches(candidates, courseTitle, lessonTitle, requiredKeywords);
            if (filteredCandidates.isEmpty()) {
                filteredCandidates = candidates;
            }

            int bestIndex = -1;
            if (geminiService != null) {
                bestIndex = geminiService.evaluateVideoCandidates(courseTitle, lessonTitle, learnerLevel, requiredKeywords, filteredCandidates);
            }

            if (bestIndex >= 0 && bestIndex < filteredCandidates.size()) {
                return filteredCandidates.get(bestIndex);
            } else if (bestIndex == -1 && geminiService != null) {

                return result;
            }

            Map<String, String> bestFallback = selectStrictKeywordMatch(filteredCandidates, courseTitle, lessonTitle, requiredKeywords);
            if (bestFallback != null) {
                return bestFallback;
            }

        } catch (Exception e) {
            System.err.println("YouTube Video Recommendation Error: " + e.getMessage());
        }

        return result;
    }

    public Map<String, String> searchVideo(String query) {
        return findBestVideo(query, query, query, "BEGINNER", Collections.emptyList(), null);
    }

    private List<Map<String, String>> filterObviousMismatches(
            List<Map<String, String>> candidates,
            String courseTitle,
            String lessonTitle,
            List<String> requiredKeywords
    ) {
        List<Map<String, String>> filtered = new ArrayList<>();
        String targetLang = detectProgrammingLanguage(courseTitle + " " + lessonTitle);

        for (Map<String, String> c : candidates) {
            String text = (c.get("title") + " " + c.get("description")).toLowerCase();

            if (targetLang != null && !targetLang.isEmpty()) {
                if (targetLang.equals("cpp") || targetLang.equals("c++")) {
                    if (text.contains("python") && !text.contains("c++") && !text.contains("cpp")) continue;
                    if (text.contains("java ") && !text.contains("c++") && !text.contains("cpp")) continue;
                    if (text.contains("c#") && !text.contains("c++") && !text.contains("cpp")) continue;
                } else if (targetLang.equals("python")) {
                    if (text.contains("java ") && !text.contains("python")) continue;
                    if (text.contains("c++") && !text.contains("python")) continue;
                } else if (targetLang.equals("java")) {
                    if (text.contains("python") && !text.contains("java")) continue;
                    if (text.contains("c++") && !text.contains("java")) continue;
                }
            }

            filtered.add(c);
        }
        return filtered;
    }

    private Map<String, String> selectStrictKeywordMatch(
            List<Map<String, String>> candidates,
            String courseTitle,
            String lessonTitle,
            List<String> requiredKeywords
    ) {
        String[] lessonWords = lessonTitle.toLowerCase().split("[^a-zA-Z0-9]+");
        Map<String, String> topCandidate = null;
        int maxMatches = 0;

        for (Map<String, String> c : candidates) {
            String title = c.get("title").toLowerCase();
            int matches = 0;

            for (String word : lessonWords) {
                if (word.length() > 3 && title.contains(word)) {
                    matches++;
                }
            }

            if (requiredKeywords != null) {
                for (String kw : requiredKeywords) {
                    if (kw.length() > 2 && title.contains(kw.toLowerCase())) {
                        matches += 2;
                    }
                }
            }

            if (matches > maxMatches) {
                maxMatches = matches;
                topCandidate = c;
            }
        }

        if (maxMatches >= 2) {
            return topCandidate;
        }
        return null;
    }

    private String detectProgrammingLanguage(String text) {
        String lower = text.toLowerCase();
        if (lower.contains("c++") || lower.contains("cpp")) return "cpp";
        if (lower.contains("python")) return "python";
        if (lower.contains("java ") || lower.contains("java)")) return "java";
        if (lower.contains("javascript") || lower.contains("js ") || lower.contains("react") || lower.contains("node")) return "javascript";
        if (lower.contains("typescript") || lower.contains("ts ")) return "typescript";
        if (lower.contains("rust")) return "rust";
        if (lower.contains("golang") || lower.contains("go ")) return "go";
        if (lower.contains("sql") || lower.contains("postgres") || lower.contains("mysql")) return "sql";
        return null;
    }
}
