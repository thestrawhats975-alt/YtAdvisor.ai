package com.makeithook.v_10.dto;

import lombok.Data;

@Data
public class IdeaRequestDto {
    private String idea;
    private String contentMode; // "SEARCH" or "BROWSE"
    private String userId; // Provided by React auth token
}
