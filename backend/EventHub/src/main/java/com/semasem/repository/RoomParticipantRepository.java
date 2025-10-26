package com.semasem.repository;

import com.semasem.repository.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    List<RoomParticipant> findByRoomUuidAndStatus(UUID roomUuid, ParticipantStatus status);

    Optional<RoomParticipant> findByRoomUuidAndUserUuid(UUID roomUuid, UUID userUuid);


    @Query("SELECT COUNT(rp) > 0 FROM RoomParticipant rp WHERE rp.room.uuid = :roomUuid AND rp.user.uuid = :userUuid AND rp.role = 'HOST'")
    boolean isUserHostOfRoom(@Param("roomUuid") UUID roomUuid, @Param("userUuid") UUID userUuid);

    @Query("SELECT COUNT(rp) FROM RoomParticipant rp WHERE rp.room.uuid = :roomUuid AND rp.status = 'JOINED'")
    int countActiveParticipantsInRoom(@Param("roomUuid") UUID roomUuid);

    @Modifying
    @Query("UPDATE RoomParticipant rp SET rp.status = 'LEFT', rp.leftAt = CURRENT_TIMESTAMP WHERE rp.room.uuid = :roomUuid AND rp.status = 'JOINED'")
    void markAllParticipantsAsLeft(@Param("roomUuid") UUID roomUuid);

    @Modifying
    @Query("UPDATE RoomParticipant rp SET rp.isAudioEnabled = :audioEnabled, rp.isVideoEnabled = :videoEnabled WHERE rp.id = :participantId")
    void updateMediaStatus(@Param("participantId") Long participantId,
                           @Param("audioEnabled") boolean audioEnabled,
                           @Param("videoEnabled") boolean videoEnabled);


    boolean existsByRoomUuidAndUserUuidAndStatus(UUID roomUuid, UUID userUuid, ParticipantStatus status);

    Optional<RoomParticipant> findByRoomAndUser(Room room, User user);

    @Query("SELECT rp FROM RoomParticipant rp " +
            "JOIN FETCH rp.user " +
            "JOIN FETCH rp.room " +
            "WHERE rp.room.uuid = :roomUuid")
    List<RoomParticipant> findByRoomUuidWithDetails(@Param("roomUuid") UUID roomUuid);

    @Query("SELECT rp FROM RoomParticipant rp " +
            "JOIN FETCH rp.user " +
            "JOIN FETCH rp.room " +
            "WHERE rp.room.uuid = :roomUuid AND rp.user.uuid = :userUuid")
    Optional<RoomParticipant> findByRoomAndUserWithDetails(@Param("roomUuid") UUID roomUuid,
                                                           @Param("userUuid") UUID userUuid);


}