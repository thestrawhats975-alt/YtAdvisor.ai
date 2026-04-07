package com.YtAdvisor.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChannelConnectDto {

    @NotBlank(message = "channelInput must not be blank")
    private String channelInput;
}
