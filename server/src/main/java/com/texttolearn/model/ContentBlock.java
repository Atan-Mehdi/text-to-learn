package com.texttolearn.model;

import java.util.List;

public class ContentBlock {
    private String type;
    private String text;
    private String language;
    private String query;
    private String url;
    private String videoId;
    private String videoTitle;
    private String videoThumbnail;
    private List<String> requiredKeywords;
    private String question;
    private List<String> options;
    private Integer answer;
    private String explanation;

    public ContentBlock() {}

    public ContentBlock(String type, String text, String language, String query, String url, String videoId, String videoTitle, String videoThumbnail, List<String> requiredKeywords, String question, List<String> options, Integer answer, String explanation) {
        this.type = type;
        this.text = text;
        this.language = language;
        this.query = query;
        this.url = url;
        this.videoId = videoId;
        this.videoTitle = videoTitle;
        this.videoThumbnail = videoThumbnail;
        this.requiredKeywords = requiredKeywords;
        this.question = question;
        this.options = options;
        this.answer = answer;
        this.explanation = explanation;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String type;
        private String text;
        private String language;
        private String query;
        private String url;
        private String videoId;
        private String videoTitle;
        private String videoThumbnail;
        private List<String> requiredKeywords;
        private String question;
        private List<String> options;
        private Integer answer;
        private String explanation;

        public Builder type(String type) { this.type = type; return this; }
        public Builder text(String text) { this.text = text; return this; }
        public Builder language(String language) { this.language = language; return this; }
        public Builder query(String query) { this.query = query; return this; }
        public Builder url(String url) { this.url = url; return this; }
        public Builder videoId(String videoId) { this.videoId = videoId; return this; }
        public Builder videoTitle(String videoTitle) { this.videoTitle = videoTitle; return this; }
        public Builder videoThumbnail(String videoThumbnail) { this.videoThumbnail = videoThumbnail; return this; }
        public Builder requiredKeywords(List<String> requiredKeywords) { this.requiredKeywords = requiredKeywords; return this; }
        public Builder question(String question) { this.question = question; return this; }
        public Builder options(List<String> options) { this.options = options; return this; }
        public Builder answer(Integer answer) { this.answer = answer; return this; }
        public Builder explanation(String explanation) { this.explanation = explanation; return this; }

        public ContentBlock build() {
            return new ContentBlock(type, text, language, query, url, videoId, videoTitle, videoThumbnail, requiredKeywords, question, options, answer, explanation);
        }
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getVideoId() { return videoId; }
    public void setVideoId(String videoId) { this.videoId = videoId; }

    public String getVideoTitle() { return videoTitle; }
    public void setVideoTitle(String videoTitle) { this.videoTitle = videoTitle; }

    public String getVideoThumbnail() { return videoThumbnail; }
    public void setVideoThumbnail(String videoThumbnail) { this.videoThumbnail = videoThumbnail; }

    public List<String> getRequiredKeywords() { return requiredKeywords; }
    public void setRequiredKeywords(List<String> requiredKeywords) { this.requiredKeywords = requiredKeywords; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public Integer getAnswer() { return answer; }
    public void setAnswer(Integer answer) { this.answer = answer; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }
}
