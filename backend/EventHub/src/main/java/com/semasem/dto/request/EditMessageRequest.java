package com.semasem.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EditMessageRequest {

    @NotBlank(message = "Content cannot be empty")
    private String content;
}
