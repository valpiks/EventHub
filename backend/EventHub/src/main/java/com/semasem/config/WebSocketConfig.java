package com.semasem.config;


import com.semasem.controller.WebRTCController;
import com.semasem.controller.WebSocketChatController;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebRTCController webRTCController;
    private final WebSocketChatController webSocketChatController;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webRTCController, "/api/ws/webrtc-plain")
                .setAllowedOriginPatterns("*");

        registry.addHandler(webSocketChatController, "/ws-chat")
                .setAllowedOriginPatterns("*");
    }
}