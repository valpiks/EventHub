package com.semasem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaStateService {

    private final Map<UUID, Map<UUID, MediaState>> roomMediaStates = new ConcurrentHashMap<>();

    public static class MediaState {
        private boolean audioEnabled;
        private boolean videoEnabled;
        private boolean screenSharing;
        private long lastUpdate;

        public MediaState() {
            this.audioEnabled = true; // по умолчанию включено
            this.videoEnabled = true;
            this.screenSharing = false;
            this.lastUpdate = System.currentTimeMillis();
        }

        public MediaState(boolean audioEnabled, boolean videoEnabled, boolean screenSharing) {
            this.audioEnabled = audioEnabled;
            this.videoEnabled = videoEnabled;
            this.screenSharing = screenSharing;
            this.lastUpdate = System.currentTimeMillis();
        }

        public boolean isAudioEnabled() { return audioEnabled; }
        public void setAudioEnabled(boolean audioEnabled) {
            this.audioEnabled = audioEnabled;
            this.lastUpdate = System.currentTimeMillis();
        }

        public boolean isVideoEnabled() { return videoEnabled; }
        public void setVideoEnabled(boolean videoEnabled) {
            this.videoEnabled = videoEnabled;
            this.lastUpdate = System.currentTimeMillis();
        }

        public boolean isScreenSharing() { return screenSharing; }
        public void setScreenSharing(boolean screenSharing) {
            this.screenSharing = screenSharing;
            this.lastUpdate = System.currentTimeMillis();
        }

        public long getLastUpdate() { return lastUpdate; }
    }

    public void updateMediaState(UUID roomId, UUID userId, Boolean audioEnabled, Boolean videoEnabled, Boolean screenSharing) {
        roomMediaStates.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>());

        MediaState currentState = roomMediaStates.get(roomId).computeIfAbsent(userId, k -> new MediaState());

        if (audioEnabled != null) {
            currentState.setAudioEnabled(audioEnabled);
        }
        if (videoEnabled != null) {
            currentState.setVideoEnabled(videoEnabled);
        }
        if (screenSharing != null) {
            currentState.setScreenSharing(screenSharing);
        }

        log.debug("Media state updated for user {} in room {}: audio={}, video={}, screen={}",
                userId, roomId, currentState.isAudioEnabled(), currentState.isVideoEnabled(), currentState.isScreenSharing());
    }

    public MediaState getMediaState(UUID roomId, UUID userId) {
        Map<UUID, MediaState> roomStates = roomMediaStates.get(roomId);
        if (roomStates != null) {
            return roomStates.get(userId);
        }
        return new MediaState();
    }

    public Map<UUID, MediaState> getAllMediaStates(UUID roomId) {
        return roomMediaStates.getOrDefault(roomId, new ConcurrentHashMap<>());
    }

    public void removeMediaState(UUID roomId, UUID userId) {
        Map<UUID, MediaState> roomStates = roomMediaStates.get(roomId);
        if (roomStates != null) {
            roomStates.remove(userId);
            log.debug("Media state removed for user {} in room {}", userId, roomId);

            if (roomStates.isEmpty()) {
                roomMediaStates.remove(roomId);
            }
        }
    }

    public void cleanupRoom(UUID roomId) {
        roomMediaStates.remove(roomId);
        log.info("Media states cleaned up for room {}", roomId);
    }

    public boolean hasActiveMediaParticipants(UUID roomId) {
        Map<UUID, MediaState> roomStates = roomMediaStates.get(roomId);
        if (roomStates != null) {
            return roomStates.values().stream()
                    .anyMatch(state -> state.isAudioEnabled() || state.isVideoEnabled() || state.isScreenSharing());
        }
        return false;
    }
}