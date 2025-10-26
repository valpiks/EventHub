import { useCallback, useEffect, useRef, useState } from 'react';

interface MediaState {
	audio: MediaStream | null;
	video: MediaStream | null;
	screen: MediaStream | null;
}

export const useMediaStream = () => {
	const [mediaState, setMediaState] = useState<MediaState>({
		audio: null,
		video: null,
		screen: null,
	});

	const restoreMediaState = useCallback(async () => {
		console.log('🔄 RESTORING MEDIA STATE...');
		const saved = localStorage.getItem('mediaState');
		const savedState = saved
			? JSON.parse(saved)
			: { audio: false, video: true };

		console.log('📖 SAVED STATE:', savedState);

		try {
			if (savedState.video && !mediaState.video) {
				console.log('🔄 Restoring video...');
				await startVideo();
			}
			if (savedState.audio && !mediaState.audio) {
				console.log('🔄 Restoring audio...');
				await startAudio();
			}
		} catch (error) {
			console.error('❌ Error restoring media state:', error);
		}
	}, []);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const audioStreamRef = useRef<MediaStream | null>(null);
	const videoStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);

	useEffect(() => {
		console.log('🎯 MEDIA STATE UPDATED:', {
			audio: mediaState.audio
				? mediaState.audio
						.getTracks()
						.map(t => ({ kind: t.kind, enabled: t.enabled }))
				: 'null',
			video: mediaState.video
				? mediaState.video
						.getTracks()
						.map(t => ({ kind: t.kind, enabled: t.enabled }))
				: 'null',
			screen: mediaState.screen
				? mediaState.screen
						.getTracks()
						.map(t => ({ kind: t.kind, enabled: t.enabled }))
				: 'null',
		});
	}, [mediaState]);

	const saveMediaState = useCallback((audio: boolean, video: boolean) => {
		localStorage.setItem('mediaState', JSON.stringify({ audio, video }));
		console.log('💾 SAVED MEDIA STATE:', { audio, video });
	}, []);

	const startAudio = async (): Promise<MediaStream | null> => {
		if (mediaState.audio) {
			console.log('🎤 Audio already started');
			return mediaState.audio;
		}

		setIsLoading(true);
		setError(null);
		try {
			console.log('🎤 STARTING AUDIO...');
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			console.log(
				'🎤 AUDIO STARTED:',
				stream.getTracks().map(t => t.kind)
			);
			audioStreamRef.current = stream;
			setMediaState(prev => ({ ...prev, audio: stream }));

			saveMediaState(true, !!mediaState.video);
			return stream;
		} catch (error) {
			console.error('❌ Error starting audio:', error);
			setError('Failed to access microphone');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const stopAudio = useCallback(() => {
		console.log('🎤 STOPPING AUDIO');
		if (audioStreamRef.current) {
			audioStreamRef.current.getTracks().forEach(track => {
				console.log(`🎤 Stopping audio track:`, track.id);
				track.stop();
			});
			audioStreamRef.current = null;
		}
		setMediaState(prev => ({ ...prev, audio: null }));
		saveMediaState(false, !!mediaState.video);
	}, [mediaState.video, saveMediaState]);

	const startVideo = async (): Promise<MediaStream | null> => {
		if (mediaState.video) {
			console.log('📹 Video already started');
			return mediaState.video;
		}

		setIsLoading(true);
		setError(null);
		try {
			console.log('📹 STARTING VIDEO...');
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: 1280,
					height: 720,
					frameRate: 30,
				},
			});

			console.log(
				'📹 VIDEO STARTED:',
				stream.getTracks().map(t => t.kind)
			);
			videoStreamRef.current = stream;
			setMediaState(prev => ({ ...prev, video: stream }));

			saveMediaState(!!mediaState.audio, true);
			return stream;
		} catch (error) {
			console.error('❌ Error starting video:', error);
			setError('Failed to access camera');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const stopVideo = useCallback(() => {
		console.log('📹 STOPPING VIDEO');
		if (videoStreamRef.current) {
			videoStreamRef.current.getTracks().forEach(track => {
				console.log(`📹 Stopping video track:`, track.id);
				track.stop();
			});
			videoStreamRef.current = null;
		}
		setMediaState(prev => ({ ...prev, video: null }));
		saveMediaState(!!mediaState.audio, false);
	}, [mediaState.audio, saveMediaState]);

	const startScreenShare = async (): Promise<MediaStream | null> => {
		if (mediaState.screen) {
			console.log('🖥️ Screen share already started');
			return mediaState.screen;
		}

		setIsLoading(true);
		setError(null);
		try {
			console.log('🖥️ STARTING SCREEN SHARE...');
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true,
			});

			console.log(
				'🖥️ SCREEN SHARE STARTED:',
				stream.getTracks().map(t => t.kind)
			);

			stream.getVideoTracks()[0].onended = () => {
				console.log('🖥️ Screen share ended by user');
				stopScreenShare();
			};

			screenStreamRef.current = stream;
			setMediaState(prev => ({ ...prev, screen: stream }));

			return stream;
		} catch (error) {
			console.error('❌ Error starting screen share:', error);
			setError('Failed to start screen sharing');
			return null;
		} finally {
			setIsLoading(false);
		}
	};

	const stopScreenShare = useCallback(() => {
		console.log('🖥️ STOPPING SCREEN SHARE');
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach(track => {
				console.log(`🖥️ Stopping screen track:`, track.id);
				track.stop();
			});
			screenStreamRef.current = null;
		}
		setMediaState(prev => ({ ...prev, screen: null }));
	}, []);

	const stopTrack = useCallback(
		(type: 'audio' | 'video' | 'screen') => {
			console.log(`🛑 STOPPING TRACK: ${type}`);
			switch (type) {
				case 'audio':
					stopAudio();
					break;
				case 'video':
					stopVideo();
					break;
				case 'screen':
					stopScreenShare();
					break;
			}
		},
		[stopAudio, stopVideo, stopScreenShare]
	);

	const stopAll = useCallback(() => {
		console.log('🛑 STOPPING ALL MEDIA');
		stopAudio();
		stopVideo();
		stopScreenShare();
		saveMediaState(false, false);
	}, [stopAudio, stopVideo, stopScreenShare, saveMediaState]);

	const [combinedStream, setCombinedStream] = useState<MediaStream | null>(
		null
	);

	useEffect(() => {
		const newStream = new MediaStream();
		let hasTracks = false;

		if (mediaState.audio) {
			mediaState.audio.getAudioTracks().forEach(track => {
				newStream.addTrack(track);
				hasTracks = true;
			});
		}

		if (mediaState.video && !mediaState.screen) {
			mediaState.video.getVideoTracks().forEach(track => {
				newStream.addTrack(track);
				hasTracks = true;
			});
		}

		if (mediaState.screen) {
			mediaState.screen.getVideoTracks().forEach(track => {
				newStream.addTrack(track);
				hasTracks = true;
			});

			mediaState.screen.getAudioTracks().forEach(track => {
				newStream.addTrack(track);
				hasTracks = true;
			});
		}

		console.log('🔗 COMBINED STREAM:', {
			tracks: newStream.getTracks().map(t => t.kind),
			hasTracks,
		});

		setCombinedStream(hasTracks ? newStream : null);
	}, [mediaState.audio, mediaState.video, mediaState.screen]);

	return {
		mediaState,
		combinedStream,
		isLoading,
		error,
		hasAudio: !!mediaState.audio,
		hasVideo: !!mediaState.video,
		hasScreen: !!mediaState.screen,
		startAudio,
		stopAudio,
		startVideo,
		stopVideo,
		startScreenShare,
		stopScreenShare,
		stopTrack,
		stopAll,
		restoreMediaState,
		saveMediaState,
	};
};
