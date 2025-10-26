package com.semasem.service;

import com.semasem.repository.entity.ParticipantInfo;
import com.semasem.repository.entity.ParticipantRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class RoomSessionService {

    private final Map<UUID, Set<UUID>> activeRoomParticipants = new ConcurrentHashMap<>();
    private final Map<UUID, ParticipantMediaInfo> participantMediaInfo = new ConcurrentHashMap<>();

    public record ParticipantMediaInfo(
            UUID userId,
            String name,
            String email,
            ParticipantRole role,
            boolean isGuest,
            Instant joinedAt,
            Instant lastActiveAt,
            boolean isAudioEnabled,
            boolean isVideoEnabled,
            String sessionId
    ) {
        public ParticipantMediaInfo withMediaStatus(boolean audioEnabled, boolean videoEnabled) {
            return new ParticipantMediaInfo(
                    userId, name, email, role, isGuest, joinedAt,
                    Instant.now(), audioEnabled, videoEnabled, sessionId
            );
        }

        public ParticipantMediaInfo withLastActive() {
            return new ParticipantMediaInfo(
                    userId, name, email, role, isGuest, joinedAt,
                    Instant.now(), isAudioEnabled, isVideoEnabled, sessionId
            );
        }
    }

    public void addParticipant(UUID roomId, UUID userId, String name, String email,
                               ParticipantRole role, boolean isGuest, Instant joinedAt, String sessionId) {
        activeRoomParticipants
                .computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet())
                .add(userId);

        participantMediaInfo.put(userId, new ParticipantMediaInfo(
                userId, name, email, role, isGuest, joinedAt, Instant.now(),
                true, true, sessionId
        ));

        log.info("User {} joined room {}. Active participants: {}",
                userId, roomId, getActiveParticipantsCount(roomId));
    }

    public void updateParticipantMediaStatus(UUID userId, boolean isAudioEnabled, boolean isVideoEnabled) {
        participantMediaInfo.computeIfPresent(userId, (id, info) ->
                info.withMediaStatus(isAudioEnabled, isVideoEnabled)
        );

        log.debug("Updated media status for user {}: audio={}, video={}",
                userId, isAudioEnabled, isVideoEnabled);
    }

    public void removeParticipant(UUID roomId, UUID userId) {
        Optional.ofNullable(activeRoomParticipants.get(roomId))
                .ifPresent(participants -> {
                    participants.remove(userId);
                    if (participants.isEmpty()) {
                        activeRoomParticipants.remove(roomId);
                    }
                });

        participantMediaInfo.remove(userId);

        log.info("User {} left room {}. Active participants: {}",
                userId, roomId, getActiveParticipantsCount(roomId));
    }

    public List<ParticipantMediaInfo> getActiveParticipants(UUID roomId) {
        return getActiveParticipantIds(roomId).stream()
                .map(participantMediaInfo::get)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    public List<ParticipantMediaInfo> getActiveParticipantsWithDetails(UUID roomId, List<ParticipantInfo> dbParticipants) {
        Set<UUID> activeParticipantIds = getActiveParticipantIds(roomId);

        return dbParticipants.stream()
                .filter(participant -> activeParticipantIds.contains(participant.getUserId()))
                .map(this::createMediaInfoFromParticipant)
                .collect(Collectors.toList());
    }

    public int getActiveParticipantsCount(UUID roomId) {
        return getActiveParticipantIds(roomId).size();
    }

    public boolean isUserInRoom(UUID roomId, UUID userId) {
        return getActiveParticipantIds(roomId).contains(userId);
    }

    public ParticipantMediaInfo getParticipantMediaInfo(UUID userId) {
        return participantMediaInfo.get(userId);
    }

    public void updateLastActive(UUID userId) {
        participantMediaInfo.computeIfPresent(userId, (id, info) -> info.withLastActive());
    }

    public List<ParticipantMediaInfo> getAllRoomParticipantsWithMediaStatus(UUID roomId, List<ParticipantInfo> allDbParticipants) {
        Set<UUID> activeParticipantIds = getActiveParticipantIds(roomId);

        return allDbParticipants.stream()
                .map(participant -> createMediaInfoWithActivity(participant, activeParticipantIds))
                .collect(Collectors.toList());
    }

    private Set<UUID> getActiveParticipantIds(UUID roomId) {
        return activeRoomParticipants.getOrDefault(roomId, Collections.emptySet());
    }

    private ParticipantMediaInfo createMediaInfoFromParticipant(ParticipantInfo participant) {
        ParticipantMediaInfo mediaInfo = participantMediaInfo.get(participant.getUserId());

        return new ParticipantMediaInfo(
                participant.getUserId(),
                participant.getName(),
                participant.getEmail(),
                participant.getRole(),
                participant.isGuest(),
                participant.getJoinedAt(),
                participant.getLastActiveAt(),
                mediaInfo != null ? mediaInfo.isAudioEnabled() : true,
                mediaInfo != null ? mediaInfo.isVideoEnabled() : true,
                mediaInfo != null ? mediaInfo.sessionId() : null
        );
    }

    private ParticipantMediaInfo createMediaInfoWithActivity(ParticipantInfo participant, Set<UUID> activeParticipantIds) {
        boolean isActive = activeParticipantIds.contains(participant.getUserId());
        ParticipantMediaInfo mediaInfo = participantMediaInfo.get(participant.getUserId());

        return new ParticipantMediaInfo(
                participant.getUserId(),
                participant.getName(),
                participant.getEmail(),
                participant.getRole(),
                participant.isGuest(),
                participant.getJoinedAt(),
                participant.getLastActiveAt(),
                isActive && mediaInfo != null ? mediaInfo.isAudioEnabled() : false,
                isActive && mediaInfo != null ? mediaInfo.isVideoEnabled() : false,
                isActive && mediaInfo != null ? mediaInfo.sessionId() : null
        );
    }
}