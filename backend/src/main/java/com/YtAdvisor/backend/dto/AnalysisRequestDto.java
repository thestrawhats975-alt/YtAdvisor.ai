package com.YtAdvisor.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AnalysisRequestDto {

    @NotBlank(message = "video_idea must not be blank")
    @JsonProperty("video_idea")
    private String videoIdea;
}
