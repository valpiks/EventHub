package com.semasem.dto.request;

import com.semasem.repository.entity.ChatMessageType;
import com.semasem.repository.entity.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
@Builder
public class ChatMessageRequest {
    @NotBlank(message = "Content cannot be empty")
    private String content;

    @NotNull(message = "Message type is required")
    private ChatMessageType type;

    private UUID replyTo;
}
