package com.YtAdvisor.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PipelineStatusResponse {

    @JsonProperty("channel_id")
    private String channelId;

    @JsonProperty("channel_title")
    private String channelTitle;

    private String phase;

    @JsonProperty("videos_processed")
    private int videosProcessed;

    @JsonProperty("total_videos_on_channel")
    private int totalVideosOnChannel;

    @JsonProperty("is_reliable")
    private boolean isReliable;

    @JsonProperty("last_error")
    private String lastError;

    @JsonProperty("dna_summary")
    private String dnaSummary;
}
