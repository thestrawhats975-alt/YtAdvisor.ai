package com.YtAdvisor.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChannelStatusResponse {
    private String youtubeChannelId;
    private String channelTitle;
    private String phase;
    private int videosProcessed;
    private int totalVideosOnChannel;
    private boolean isReliable;
}
