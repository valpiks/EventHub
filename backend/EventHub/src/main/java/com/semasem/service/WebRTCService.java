package com.semasem.service;

import com.semasem.dto.exception.CustomException;
import com.semasem.dto.exception.ErrorCode;
import com.semasem.repository.RoomParticipantRepository;
import com.semasem.repository.RoomRepository;
import com.semasem.repository.UserRepository;
import com.semasem.repository.entity.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebRTCService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final MediaStateService mediaStateService;

    public void validateRoomAccess(UUID roomId, Principal principal) {
        if (principal == null || principal.getName() == null) {
            log.warn("Unauthorized access attempt to room {}: principal is null", roomId);
            throw new CustomException(ErrorCode.UNAUTHORIZED, "Unauthorized access");
        }

        String userIdOrEmail = principal.getName();

        if (userIdOrEmail.startsWith("anonymous-")) {
            log.warn("Anonymous user access attempt to room {}", roomId);
            throw new CustomException(ErrorCode.UNAUTHORIZED, "Anonymous users not allowed");
        }

        User user;

        try {
            UUID userUuid = UUID.fromString(userIdOrEmail);
            user = userRepository.findByUuid((userUuid))
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "User not found by UUID"));
        } catch (IllegalArgumentException e) {
            user = userRepository.findByEmail(userIdOrEmail)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND, "User not found by email"));
        }

        Room room = roomRepository.findByUuid(roomId)
                .orElseThrow(() -> new CustomException(ErrorCode.ROOM_NOT_FOUND, "Room not found"));

        if (user.isGuest() && user.getGuestExpiresAt().isBefore(Instant.now())) {
            throw new CustomException(ErrorCode.GUEST_EXPIRED, "Guest access has expired");
        }

        if (room.getStatus() != RoomStatus.ACTIVE) {
            throw new CustomException(ErrorCode.ROOM_NOT_ACTIVE, "Room is not active");
        }

        boolean hasAccess = checkRoomAccess(room, user);

        if (!hasAccess) {
            log.warn("User {} has no access to room {}", user.getUuid(), roomId);
            throw new CustomException(ErrorCode.ACCESS_DENIED, "No access to room");
        }

        updateParticipantActivity(roomId, user.getUuid());

        log.debug("User {} validated for room {}", user.getUuid(), roomId);
    }

    private boolean checkRoomAccess(Room room, User user) {
        if (room.getOwnerUuid().equals(user.getUuid())) {
            return true;
        }

        if (room.isPublic()) {
            return true;
        }

        return roomParticipantRepository.findByRoomUuidAndUserUuid(room.getUuid(), user.getUuid())
                .map(participant -> participant.isActive() &&
                        participant.getStatus() == ParticipantStatus.JOINED)
                .orElse(false);
    }

    private void updateParticipantActivity(UUID roomId, UUID userUuid) {
        roomParticipantRepository.findByRoomUuidAndUserUuid(roomId, userUuid)
                .ifPresent(participant -> {
                    participant.setLastActiveAt(Instant.now());
                    roomParticipantRepository.save(participant);
                });
    }

    public List<ParticipantInfo> getRoomParticipantsInfo(UUID roomId) {
        List<RoomParticipant> activeParticipants = roomParticipantRepository
                .findByRoomUuidAndStatus(roomId, ParticipantStatus.JOINED);

        return activeParticipants.stream()
                .map(participant -> new ParticipantInfo(
                        participant.getUser().getUuid(),
                        participant.getUser().getName(),
                        participant.getUser().getEmail(),
                        participant.getRole(),
                        participant.getUser().isGuest(),
                        participant.getJoinedAt(),
                        participant.getLastActiveAt()
                ))
                .collect(Collectors.toList());
    }

    public List<UUID> getRoomParticipantsUserIds(UUID roomId) {
        List<RoomParticipant> activeParticipants = roomParticipantRepository
                .findByRoomUuidAndStatus(roomId, ParticipantStatus.JOINED);

        return activeParticipants.stream()
                .map(participant -> participant.getUser().getUuid())
                .collect(Collectors.toList());
    }

    public void updateParticipantMediaState(UUID roomId, UUID userId, Boolean audioEnabled, Boolean videoEnabled, Boolean screenSharing) {
        validateRoomAccess(roomId, () -> userId.toString());

        mediaStateService.updateMediaState(roomId, userId, audioEnabled, videoEnabled, screenSharing);

        log.debug("Media state updated for user {} in room {}", userId, roomId);
    }

    public Map<UUID, MediaStateService.MediaState> getRoomMediaStates(UUID roomId) {
        return mediaStateService.getAllMediaStates(roomId);
    }

    public void cleanupParticipantMediaState(UUID roomId, UUID userId) {
        mediaStateService.removeMediaState(roomId, userId);
    }

    public void participantLeft(UUID roomId, UUID userId) {
        cleanupParticipantMediaState(roomId, userId);

        roomParticipantRepository.findByRoomUuidAndUserUuid(roomId, userId)
                .ifPresent(participant -> {
                    participant.setStatus(ParticipantStatus.LEFT);
                    participant.setLeftAt(Instant.now());
                    roomParticipantRepository.save(participant);
                });

        log.info("User {} left room {} and media state cleaned up", userId, roomId);
    }
}

