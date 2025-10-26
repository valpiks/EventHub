import { IconPhone, IconSettings, IconShare } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getRoomData } from '~/api/room';
import { MediaControls } from '~/components/conference/MediaControls';
import { ParticipantsSidebar } from '~/components/conference/ParticipantSidebar';
import { ScreenShare } from '~/components/conference/ScreenShare';
import { UserVideo } from '~/components/conference/UserVideo';
import { InviteModal } from '~/components/modal/inviteModal';
import { Button } from '~/components/UI/button';

import { useAuth } from '~/context/AuthContext';
import { useMediaStream } from '~/hooks/useMediaStream';
import { useVideoLayout } from '~/hooks/useVideoLayout';
import { useVoiceActivity } from '~/hooks/useVoiceActivity';
import { useWebRTC } from '~/hooks/useWebRTC';

export default function RoomPage() {
	const navigate = useNavigate();
	const [fullscreenUser, setFullscreenUser] = useState<string | null>(null);
	const { id } = useParams();
	const [roomData, setRoomData] = useState(null);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	const { user } = useAuth();
	const token = localStorage.getItem('token');

	const {
		mediaState,
		combinedStream,
		startAudio,
		startScreenShare,
		startVideo,
		stopTrack,
		restoreMediaState,
	} = useMediaStream();

	const {
		remoteStreams,
		participants,
		participantsCount,
		isConnected,
		requestParticipants,
		replaceAudioTrack,
		replaceVideoTrack,
		sendMediaStateUpdate,
		disconnect,
		replaceScreenTrack,
		restoreVideoTrack,
	} = useWebRTC(id, user?.userId, combinedStream, token);

	useEffect(() => {
		console.log('Room page state:', {
			combinedStream: combinedStream
				? {
						audioTracks: combinedStream.getAudioTracks().length,
						videoTracks: combinedStream.getVideoTracks().length,
					}
				: 'NULL',
			remoteStreams: Array.from(remoteStreams.entries()).length,
			participantsCount,
			isConnected,
		});
	}, [combinedStream, remoteStreams, participantsCount, isConnected]);

	useEffect(() => {
		const initializeMedia = async () => {
			setTimeout(() => {
				if (!combinedStream) {
					startVideo().then(videoStream => {
						if (videoStream) {
							startAudio();
						}
					});
				}
			}, 2000);
		};

		initializeMedia();
	}, []);

	const currentUserParticipant = participants.find(
		p => p.userId === user?.userId
	);
	const currentAudioEnabled =
		currentUserParticipant?.audioEnabled ?? !!mediaState.audio;
	const currentVideoEnabled =
		currentUserParticipant?.videoEnabled ?? !!mediaState.video;

	const displayUsers = useMemo(() => {
		const localUser = {
			id: user?.userId || 'local',
			userId: user?.userId || 'local',
			name: user?.name || 'Вы',
			stream: mediaState.video,
			isYou: true,
			isAudioEnabled: currentAudioEnabled,
			isVideoEnabled: currentVideoEnabled,
			email: user?.email,
			role: currentUserParticipant?.role,
			isGuest: false,
		};

		const remoteUsers = participants
			.filter(participant => participant.userId !== user?.userId)
			.map(participant => {
				const userStream = remoteStreams.get(participant.userId);

				return {
					id: participant.userId,
					userId: participant.userId,
					name: participant.name,
					stream: userStream,
					isYou: false,
					isAudioEnabled: participant.audioEnabled,
					isVideoEnabled: participant.videoEnabled,
					email: participant.email,
					role: participant.role,
					isGuest: participant.guest,
				};
			});

		return [localUser, ...remoteUsers];
	}, [
		user?.userId,
		user?.name,
		user?.email,
		mediaState.video,
		currentAudioEnabled,
		currentVideoEnabled,
		currentUserParticipant?.role,
		participants,
		remoteStreams,
	]);

	const { totalUsers, gridConfig } = useVideoLayout(
		!!mediaState.screen,
		displayUsers
	);

	const isSpeaking = useVoiceActivity(
		mediaState.audio && mediaState.audio.getAudioTracks().length > 0
			? mediaState.audio
			: null
	);

	useEffect(() => {
		restoreMediaState();
	}, [restoreMediaState]);

	useEffect(() => {
		const fetchRoomData = async () => {
			const data = await getRoomData(id);
			setRoomData(data.data);
		};

		fetchRoomData();
	}, [id]);

	const toggleMicrophone = async () => {
		const newAudioState = !currentAudioEnabled;

		try {
			if (newAudioState) {
				const stream = await startAudio();
				if (stream) {
					const audioTrack = stream.getAudioTracks()[0];
					await replaceAudioTrack(audioTrack);
				}
			} else {
				await replaceAudioTrack(null);
			}

			await sendMediaStateUpdate(
				newAudioState,
				currentVideoEnabled,
				!!mediaState.screen
			);

			setTimeout(() => {
				requestParticipants();
			}, 500);
		} catch (error) {
			console.error('Error toggling microphone:', error);
		}
	};

	const toggleCamera = async () => {
		const newVideoState = !currentVideoEnabled;

		try {
			if (newVideoState) {
				const stream = await startVideo();
				if (stream) {
					const videoTrack = stream.getVideoTracks()[0];
					await replaceVideoTrack(videoTrack);
				}
			} else {
				await replaceVideoTrack(null);
			}

			await sendMediaStateUpdate(
				currentAudioEnabled,
				newVideoState,
				!!mediaState.screen
			);

			setTimeout(() => {
				requestParticipants();
			}, 500);
		} catch (error) {
			console.error('Error toggling camera:', error);
		}
	};

	const toggleScreenSharing = async () => {
		try {
			if (mediaState.screen) {
				await restoreVideoTrack();
				stopTrack('screen');
				await sendMediaStateUpdate(
					currentAudioEnabled,
					currentVideoEnabled,
					false
				);
			} else {
				const screenStream = await startScreenShare();

				if (screenStream) {
					const screenTrack = screenStream.getVideoTracks()[0];

					screenTrack.onended = () => {
						toggleScreenSharing();
					};

					await replaceScreenTrack(screenTrack);
					await sendMediaStateUpdate(currentAudioEnabled, false, true);
				} else {
					console.error('Failed to start screen share');
				}
			}

			setTimeout(() => {
				requestParticipants();
			}, 500);
		} catch (error) {
			console.error('Error toggling screen share:', error);

			if (mediaState.screen) {
				await restoreVideoTrack();
				stopTrack('screen');
			}
		}
	};

	const toggleFullscreen = (userId: string) => {
		if (fullscreenUser === userId) {
			setFullscreenUser(null);
		} else {
			setFullscreenUser(userId);
		}
	};

	const handleUserClick = (userId: string) => {
		if (userId === 'local-screen') {
			setFullscreenUser('local-screen');
			return;
		}

		toggleFullscreen(userId);
	};

	const handleFullscreenClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setFullscreenUser(null);
	};

	if (fullscreenUser) {
		let fullscreenUserData;

		if (fullscreenUser === 'local-screen') {
			fullscreenUserData = {
				id: 'local-screen',
				userId: user?.userId || 'local',
				name: 'Ваш скриншот',
				stream: mediaState.screen,
				isYou: true,
				isAudioEnabled: currentAudioEnabled,
				isVideoEnabled: true,
			};
		} else {
			fullscreenUserData = displayUsers.find(u => u.id === fullscreenUser);
		}

		return (
			<>
				<div
					className='h-screen flex flex-col cursor-pointer bg-black'
					onClick={handleFullscreenClick}
				>
					<div className='flex-1 flex items-center justify-center p-4'>
						{fullscreenUserData && (
							<div className='w-full h-full max-h-[calc(100vh-80px)]'>
								<UserVideo
									userId={fullscreenUserData.id}
									userName={fullscreenUserData.name}
									stream={fullscreenUserData.stream}
									isYou={fullscreenUserData.isYou}
									isAudioEnabled={fullscreenUserData.isAudioEnabled}
									isVideoEnabled={fullscreenUserData.isVideoEnabled}
									isSpeaking={fullscreenUserData.isYou && isSpeaking}
									avatarSize='lg'
									className='w-full h-full object-contain'
								/>
							</div>
						)}
					</div>

					<div className='h-20 bg-black/80 border-t border-white/20 flex items-center justify-center'>
						<MediaControls
							isAudioEnabled={currentAudioEnabled}
							isVideoEnabled={currentVideoEnabled}
							isScreenSharing={!!mediaState.screen}
							onToggleAudio={toggleMicrophone}
							onToggleVideo={toggleCamera}
							onToggleScreenShare={toggleScreenSharing}
						/>
					</div>
				</div>
				<InviteModal
					isOpen={isInviteModalOpen}
					onClose={() => setIsInviteModalOpen(false)}
					inviteLink={roomData?.inviteLink}
				/>
			</>
		);
	}

	return (
		<>
			<div className='h-screen bg-background flex flex-col'>
				<header className='h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0'>
					<div>
						<h1 className='font-bold text-lg'>{roomData?.title}</h1>
						<p className='text-xs text-muted-foreground'>ID: {id}</p>
					</div>
					<div className='flex items-center gap-2'>
						<Button
							variant='ghost'
							size='icon'
							onClick={() => setIsInviteModalOpen(true)}
						>
							<IconShare className='h-5 w-5' />
						</Button>
						<Button variant='ghost' size='icon'>
							<IconSettings className='h-5 w-5' />
						</Button>
						<Button
							onClick={() => {
								navigate('/');
								disconnect();
							}}
							variant='destructive'
							size='small'
						>
							<IconPhone className='h-4 w-4 mr-2' />
							Выйти
						</Button>
					</div>
				</header>

				<section className='flex-1 flex overflow-hidden'>
					<div className='flex-1 flex flex-col min-h-0'>
						<div className='flex-1 min-h-0 p-4'>
							<div className={`grid ${gridConfig.gridClass} gap-4 h-full`}>
								{mediaState.screen && (
									<ScreenShare
										stream={mediaState.screen}
										onClick={() => handleUserClick('local-screen')}
									/>
								)}

								{displayUsers.map(user => (
									<UserVideo
										key={user.id}
										userId={user.id}
										userName={user.name}
										stream={user.stream}
										isYou={user.isYou}
										isAudioEnabled={user.isAudioEnabled}
										isVideoEnabled={user.isVideoEnabled}
										isSpeaking={user.isYou && isSpeaking}
										onClick={() => handleUserClick(user.id)}
										avatarSize={
											totalUsers > 4 ? 'sm' : totalUsers > 1 ? 'md' : 'lg'
										}
									/>
								))}
							</div>
						</div>

						<div className='h-20 shrink-0 border-t border-border bg-card/50 backdrop-blur-sm flex items-center justify-center px-4'>
							<MediaControls
								isAudioEnabled={currentAudioEnabled}
								isVideoEnabled={currentVideoEnabled}
								isScreenSharing={!!mediaState.screen}
								onToggleAudio={toggleMicrophone}
								onToggleVideo={toggleCamera}
								onToggleScreenShare={toggleScreenSharing}
							/>
						</div>
					</div>

					<ParticipantsSidebar
						roomId={id}
						token={token}
						userId={user?.userId}
						participants={participants}
						participantsCount={participantsCount}
						onRequestParticipants={requestParticipants}
					/>
				</section>
			</div>

			<InviteModal
				isOpen={isInviteModalOpen}
				onClose={() => setIsInviteModalOpen(false)}
				inviteLink={roomData?.inviteLink}
			/>
		</>
	);
}
