package com.texttolearn.controller;

import com.texttolearn.service.YouTubeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/youtube")
public class YouTubeController {

    private final YouTubeService youTubeService;

    public YouTubeController(YouTubeService youTubeService) {
        this.youTubeService = youTubeService;
    }

    @GetMapping("/search")
    public ResponseEntity<Map<String, String>> searchVideo(@RequestParam String query) {
        return ResponseEntity.ok(youTubeService.searchVideo(query));
    }
}
