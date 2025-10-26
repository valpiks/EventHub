package com.semasem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.semasem.dto.exception.CustomException;
import com.semasem.dto.exception.ErrorCode;
import com.semasem.dto.request.ChatMessageRequest;
import com.semasem.dto.request.EditMessageRequest;
import com.semasem.dto.response.ChatMessageResponse;
import com.semasem.repository.RoomParticipantRepository;
import com.semasem.repository.RoomRepository;
import com.semasem.repository.UserRepository;
import com.semasem.repository.entity.ChatMessageType;
import com.semasem.repository.entity.Room;
import com.semasem.repository.entity.RoomParticipant;
import com.semasem.repository.entity.User;
import com.semasem.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.security.Principal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketChatController extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final ChatService chatService;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository roomParticipantRepository;

    private final Map<String, WebSocketSession> chatSessions = new ConcurrentHashMap<>();
    private final Map<String, String> userChatRooms = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> roomChatSubscribers = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Map<String, String> params = extractParameters(session);
        String token = params.get("token");
        String roomId = params.get("roomId");
        String userId = params.get("userId");

        log.info("Chat WebSocket connection attempt - Room: {}, User: {}", roomId, userId);

        if (token == null || roomId == null || userId == null) {
            log.warn("Invalid chat connection parameters");
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        try {
            UUID roomUuid = UUID.fromString(roomId);
            UUID userUuid = UUID.fromString(userId);

            validateChatAccess(roomUuid, userUuid);

            chatSessions.put(userId, session);
            userChatRooms.put(userId, roomId);
            roomChatSubscribers.computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet()).add(userId);

            sendChatHistory(roomUuid, userId);

            notifyUserJoinedChat(roomId, userId);

            log.info("User {} successfully connected to chat in room {}", userId, roomId);

        } catch (Exception e) {
            log.error("Failed to establish chat connection for user {} to room {}", userId, roomId, e);
            sendChatError(session, "Failed to join chat: " + e.getMessage());
            session.close(CloseStatus.NOT_ACCEPTABLE);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String userId = getUserIdFromSession(session);
        String roomId = userChatRooms.get(userId);

        if (roomId == null) {
            log.warn("User {} sent chat message without active room", userId);
            sendChatError(session, "No active room");
            return;
        }

        try {
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");

            if (type == null) {
                log.warn("Chat message without type from user {}", userId);
                return;
            }

            log.debug("Received chat message type: {} from user: {} in room: {}", type, userId, roomId);

            switch (type) {
                case "chat_message":
                    handleChatMessage(roomId, userId, payload);
                    break;
                case "chat_typing_start":
                    handleChatTypingStart(roomId, userId);
                    break;
                case "chat_typing_stop":
                    handleChatTypingStop(roomId, userId);
                    break;
                case "chat_get_history":
                    handleChatGetHistory(roomId, userId);
                    break;
                case "chat_edit_message":
                    handleChatEditMessage(roomId, userId, payload);
                    break;
                case "chat_delete_message":
                    handleChatDeleteMessage(roomId, userId, payload);
                    break;
                case "chat_mark_read":
                    handleChatMarkRead(roomId, userId, payload);
                    break;
                default:
                    log.warn("Unknown chat message type: {} from user {}", type, userId);
                    sendChatError(session, "Unknown message type: " + type);
            }

        } catch (Exception e) {
            log.error("Error handling chat message from user {}", userId, e);
            sendChatError(session, "Error processing message");
        }
    }

    private void handleChatMessage(String roomId, String userId, Map<String, Object> payload) {
        try {
            UUID roomUuid = UUID.fromString(roomId);
            User user = getUserById(userId);

            ChatMessageRequest request = ChatMessageRequest.builder()
                    .content((String) payload.get("content"))
                    .type(ChatMessageType.TEXT)
                    .replyTo(payload.get("replyTo") != null ?
                            UUID.fromString((String) payload.get("replyTo")) : null)
                    .build();

            Principal principal = user::getEmail;
            ChatMessageResponse response = chatService.sendMessage(roomUuid, request, principal);

            Map<String, Object> message = createChatMessage("chat_message", Map.of(
                    "message", response,
                    "roomId", roomId
            ));

            broadcastToChatRoom(roomId, message);
            log.info("Chat message sent by {} in room {}", user.getEmail(), roomId);

        } catch (Exception e) {
            log.error("Error handling chat message", e);
            sendChatErrorToUser(userId, "Failed to send message");
        }
    }

    private void handleChatTypingStart(String roomId, String userId) {
        try {
            User user = getUserById(userId);

            Map<String, Object> message = createChatMessage("chat_typing", Map.of(
                    "user", createUserInfo(user),
                    "typing", true,
                    "timestamp", Instant.now().toString()
            ));

            broadcastToChatRoomExceptUser(roomId, userId, message);

        } catch (Exception e) {
            log.error("Error handling typing start", e);
        }
    }

    private void handleChatTypingStop(String roomId, String userId) {
        try {
            User user = getUserById(userId);

            Map<String, Object> message = createChatMessage("chat_typing", Map.of(
                    "user", createUserInfo(user),
                    "typing", false,
                    "timestamp", Instant.now().toString()
            ));

            broadcastToChatRoomExceptUser(roomId, userId, message);

        } catch (Exception e) {
            log.error("Error handling typing stop", e);
        }
    }

    private void handleChatGetHistory(String roomId, String userId) {
        try {
            UUID roomUuid = UUID.fromString(roomId);
            sendChatHistory(roomUuid, userId);
        } catch (Exception e) {
            log.error("Error getting chat history", e);
            sendChatErrorToUser(userId, "Failed to load chat history");
        }
    }

    private void handleChatEditMessage(String roomId, String userId, Map<String, Object> payload) {
        try {
            UUID roomUuid = UUID.fromString(roomId);
            User user = getUserById(userId);

            EditMessageRequest request = EditMessageRequest.builder()
                    .content((String) payload.get("content"))
                    .build();

            Principal principal = user::getEmail;
            UUID messageId = UUID.fromString((String) payload.get("messageId"));

            ChatMessageResponse response = chatService.editMessage(roomUuid, messageId, request, principal);

            Map<String, Object> message = createChatMessage("chat_message_edited", Map.of(
                    "message", response,
                    "roomId", roomId
            ));

            broadcastToChatRoom(roomId, message);
            log.info("Message edited by {} in room {}", user.getEmail(), roomId);

        } catch (Exception e) {
            log.error("Error editing message", e);
            sendChatErrorToUser(userId, "Failed to edit message");
        }
    }

    private void handleChatDeleteMessage(String roomId, String userId, Map<String, Object> payload) {
        try {
            UUID roomUuid = UUID.fromString(roomId);
            User user = getUserById(userId);

            Principal principal = user::getEmail;
            UUID messageId = UUID.fromString((String) payload.get("messageId"));

            if (!hasDeletePermissions(roomUuid, user.getUuid(), messageId)) {
                throw new CustomException(ErrorCode.ACCESS_DENIED, "No permission to delete this message");
            }

            chatService.deleteMessage(roomUuid, messageId, principal);

            Map<String, Object> message = createChatMessage("chat_message_deleted", Map.of(
                    "messageId", messageId.toString(),
                    "roomId", roomId,
                    "deletedBy", createUserInfo(user),
                    "timestamp", Instant.now().toString()
            ));

            broadcastToChatRoom(roomId, message);
            log.info("Message deleted by {} in room {}", user.getEmail(), roomId);

        } catch (Exception e) {
            log.error("Error deleting message", e);
            sendChatErrorToUser(userId, "Failed to delete message");
        }
    }

    private void handleChatMarkRead(String roomId, String userId, Map<String, Object> payload) {
        try {
            UUID messageId = UUID.fromString((String) payload.get("messageId"));

            log.debug("User {} marked message {} as read in room {}", userId, messageId, roomId);

        } catch (Exception e) {
            log.error("Error marking message as read", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String userId = getUserIdFromSession(session);
        String roomId = userChatRooms.get(userId);

        if (roomId != null && userId != null) {
            log.info("User {} chat connection closed from room {}, status: {}", userId, roomId, status);

            notifyUserLeftChat(roomId, userId);

            cleanupChatUserSession(userId);
        }

        cleanupChatUserSession(userId);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String userId = getUserIdFromSession(session);
        log.error("Chat transport error for user {}", userId, exception);
        cleanupChatUserSession(userId);
    }


    private void validateChatAccess(UUID roomId, UUID userId) {
        User user = userRepository.findByUuid(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Room room = roomRepository.findByUuid(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND));

        RoomParticipant participant = roomParticipantRepository
                .findByRoomUuidAndUserUuid(roomId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.ACCESS_DENIED, "Not a room participant"));

        if (!participant.isActive()) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "Participant is not active");
        }
    }

    private boolean hasDeletePermissions(UUID roomId, UUID userId, UUID messageId) {

        if (roomParticipantRepository.isUserHostOfRoom(roomId, userId)) {
            return true;
        }

        try {
            User user = getUserById(userId.toString());
            Principal principal = user::getEmail;

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void sendChatHistory(UUID roomId, String userId) {
        try {
            User user = getUserById(userId);
            Principal principal = user::getEmail;
            List<ChatMessageResponse> messages = chatService.getRecentMessages(roomId, principal);

            Map<String, Object> message = createChatMessage("chat_history", Map.of(
                    "messages", messages,
                    "roomId", roomId.toString()
            ));

            sendToChatUserSafe(userId, message);
            log.info("Sent chat history to user {} for room {}", userId, roomId);

        } catch (Exception e) {
            log.error("Error sending chat history to user {}", userId, e);
        }
    }

    private void notifyUserJoinedChat(String roomId, String userId) {
        try {
            User user = getUserById(userId);

            Map<String, Object> message = createChatMessage("chat_user_joined", Map.of(
                    "user", createUserInfo(user),
                    "timestamp", Instant.now().toString()
            ));

            broadcastToChatRoomExceptUser(roomId, userId, message);

        } catch (Exception e) {
            log.error("Error notifying user joined chat", e);
        }
    }

    private void notifyUserLeftChat(String roomId, String userId) {
        try {
            User user = getUserById(userId);

            Map<String, Object> message = createChatMessage("chat_user_left", Map.of(
                    "user", createUserInfo(user),
                    "timestamp", Instant.now().toString()
            ));

            broadcastToChatRoomExceptUser(roomId, userId, message);

        } catch (Exception e) {
            log.error("Error notifying user left chat", e);
        }
    }

    private User getUserById(String userId) {
        return userRepository.findByUuid(UUID.fromString(userId))
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private Map<String, Object> createUserInfo(User user) {
        return Map.of(
                "id", user.getUuid().toString(),
                "name", user.getName(),
                "email", user.getEmail(),
                "avatar", user.getAvatarLink()
        );
    }


    private void sendToChatUserSafe(String userId, Map<String, Object> message) {
        WebSocketSession session = chatSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String jsonMessage = objectMapper.writeValueAsString(message);
                session.sendMessage(new TextMessage(jsonMessage));
            } catch (IOException e) {
                log.error("Error sending chat message to user {}", userId, e);
                cleanupChatUserSession(userId);
            }
        }
    }

    private void broadcastToChatRoom(String roomId, Map<String, Object> message) {
        Set<String> subscribers = roomChatSubscribers.get(roomId);
        if (subscribers != null) {
            subscribers.forEach(userId -> sendToChatUserSafe(userId, message));
        }
    }

    private void broadcastToChatRoomExceptUser(String roomId, String excludedUserId, Map<String, Object> message) {
        Set<String> subscribers = roomChatSubscribers.get(roomId);
        if (subscribers != null) {
            subscribers.stream()
                    .filter(userId -> !userId.equals(excludedUserId))
                    .forEach(userId -> sendToChatUserSafe(userId, message));
        }
    }

    private void sendChatError(WebSocketSession session, String error) {
        if (session != null && session.isOpen()) {
            try {
                Map<String, Object> errorMessage = createChatMessage("error", Map.of("message", error));
                String jsonError = objectMapper.writeValueAsString(errorMessage);
                session.sendMessage(new TextMessage(jsonError));
            } catch (Exception e) {
                log.debug("Could not send chat error message", e);
            }
        }
    }

    private void sendChatErrorToUser(String userId, String error) {
        Map<String, Object> errorMessage = createChatMessage("error", Map.of("message", error));
        sendToChatUserSafe(userId, errorMessage);
    }

    private void cleanupChatUserSession(String userId) {
        String roomId = userChatRooms.get(userId);
        if (roomId != null) {
            Set<String> subscribers = roomChatSubscribers.get(roomId);
            if (subscribers != null) {
                subscribers.remove(userId);
            }
        }

        WebSocketSession session = chatSessions.remove(userId);
        userChatRooms.remove(userId);

        if (session != null && session.isOpen()) {
            try {
                session.close(CloseStatus.NORMAL);
            } catch (IOException e) {
                log.debug("Error closing chat session for user {}", userId, e);
            }
        }
    }

    private Map<String, Object> createChatMessage(String type, Map<String, Object> data) {
        Map<String, Object> message = new HashMap<>(data);
        message.put("type", type);
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    private Map<String, String> extractParameters(WebSocketSession session) {
        Map<String, String> params = new HashMap<>();
        if (session.getUri() != null && session.getUri().getQuery() != null) {
            String query = session.getUri().getQuery();
            for (String param : query.split("&")) {
                String[] keyValue = param.split("=");
                if (keyValue.length == 2) {
                    params.put(keyValue[0], keyValue[1]);
                }
            }
        }
        return params;
    }

    private String getUserIdFromSession(WebSocketSession session) {
        Map<String, String> params = extractParameters(session);
        return params.get("userId");
    }
}