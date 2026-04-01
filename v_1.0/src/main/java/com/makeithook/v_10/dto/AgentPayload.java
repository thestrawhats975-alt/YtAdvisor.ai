package com.makeithook.v_10.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AgentPayload {
    private String idea;
    private String content_mode;
    private ProfileDto creator_profile;

    @Data
    @Builder
    public static class ProfileDto {
        private String channel_id;
        private String niche;
        private Integer subscriber_count;
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> interests;
        private List<VideoDto> recent_videos;
    }

    @Data
    @Builder
    public static class VideoDto {
        private String title;
        private Integer views;
        private String format;
    }
}
