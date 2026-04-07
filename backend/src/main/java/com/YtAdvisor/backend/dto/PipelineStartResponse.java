package com.YtAdvisor.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
public class PipelineStartResponse {

    private boolean accepted;

    @JsonProperty("channel_id")
    private String channelId;

    private String phase;
}
