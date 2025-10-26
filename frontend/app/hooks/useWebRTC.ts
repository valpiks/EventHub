import { useCallback, useEffect, useRef, useState } from 'react';

interface Participant {
	id: string;
	username?: string;
	isYou?: boolean;
	audioEnabled?: boolean;
	videoEnabled?: boolean;
}

interface WebSocketMessage {
	type: string;
	[key: string]: any;
}

export const useWebRTC = (
	roomId: string,
	userId: string,
	localStream: MediaStream | null,
	token: string
) => {
	const [peers, setPeers] = useState<Map<string, RTCPeerConnection>>(new Map());
	const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
		new Map()
	);
	const [participants, setParticipants] = useState<Participant[]>([]);
	const [participantsCount, setParticipantsCount] = useState(0);
	const [isConnected, setIsConnected] = useState(false);

	const ws = useRef<WebSocket | null>(null);
	const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
	const isConnectingRef = useRef(false);

	const localStreamRef = useRef<MediaStream | null>(null);
	const currentAudioTrackRef = useRef<MediaStreamTrack | null>(null);
	const currentVideoTrackRef = useRef<MediaStreamTrack | null>(null);

	const debugVideoTracks = useCallback(
		(context: string) => {
			console.group(`VIDEO DEBUG: ${context}`);

			if (localStreamRef.current) {
				const videoTracks = localStreamRef.current.getVideoTracks();
				console.log(`Local: ${videoTracks.length} video tracks`);
				videoTracks.forEach((track, index) => {
					console.log(`Track ${index}:`, {
						id: track.id,
						kind: track.kind,
						enabled: track.enabled,
						readyState: track.readyState,
						label: track.label,
					});
				});
			} else {
				console.log('No local stream');
			}

			remoteStreams.forEach((stream, userId) => {
				const videoTracks = stream.getVideoTracks();
				console.log(`Remote ${userId}: ${videoTracks.length} video tracks`);
			});

			peersRef.current.forEach((pc, targetUserId) => {
				const senders = pc.getSenders();
				const videoSenders = senders.filter(s => s.track?.kind === 'video');
				const receivers = pc.getReceivers();
				const videoReceivers = receivers.filter(r => r.track?.kind === 'video');

				console.log(`Peer ${targetUserId}:`, {
					connectionState: pc.connectionState,
					iceState: pc.iceConnectionState,
					videoSenders: videoSenders.length,
					videoReceivers: videoReceivers.length,
				});
			});

			console.groupEnd();
		},
		[remoteStreams]
	);

	useEffect(() => {
		console.log('WebRTC State:', {
			localStream: localStream
				? {
						audioTracks: localStream.getAudioTracks().length,
						videoTracks: localStream.getVideoTracks().length,
					}
				: 'NULL',
			remoteStreams: Array.from(remoteStreams.entries()).length,
			peers: Array.from(peers.entries()).length,
			participantsCount,
			isConnected,
		});
	}, [localStream, remoteStreams, peers, participantsCount, isConnected]);

	useEffect(() => {
		localStreamRef.current = localStream;

		if (localStream) {
			localStream.getTracks().forEach((track, index) => {
				console.log(`Local track ${index}:`, {
					kind: track.kind,
					id: track.id,
					enabled: track.enabled,
				});
			});
		}

		if (localStream) {
			updateAllPeerConnections(localStream);
		}
	}, [localStream]);

	const sendMessage = (type: string, payload: any = {}) => {
		if (ws.current?.readyState === WebSocket.OPEN) {
			const message = {
				type,
				roomId,
				userId,
				...payload,
				timestamp: Date.now(),
			};
			ws.current.send(JSON.stringify(message));
		}
	};

	const sendMediaStateUpdate = useCallback(
		(
			audioEnabled: boolean,
			videoEnabled: boolean,
			screenSharing: boolean = false
		) => {
			sendMessage('media_state_update', {
				audioEnabled,
				videoEnabled,
				screenSharing,
			});
		},
		[roomId, userId]
	);

	const updateAllPeerConnections = useCallback((stream: MediaStream) => {
		peersRef.current.forEach((pc, targetUserId) => {
			const senders = pc.getSenders();

			stream.getTracks().forEach(newTrack => {
				const existingSender = senders.find(
					sender => sender.track?.kind === newTrack.kind
				);

				if (existingSender) {
					existingSender.replaceTrack(newTrack).catch(error => {
						console.error(`Error replacing ${newTrack.kind} track:`, error);
					});
				} else {
					pc.addTrack(newTrack, stream);
				}
			});
		});
	}, []);

	const replaceVideoTrack = useCallback(
		async (newTrack: MediaStreamTrack | null) => {
			if (currentVideoTrackRef.current) {
				currentVideoTrackRef.current.stop();
			}
			currentVideoTrackRef.current = newTrack;

			const updatePromises = Array.from(peersRef.current.entries()).map(
				async ([targetUserId, pc]) => {
					const senders = pc.getSenders();
					const videoSender = senders.find(
						sender => sender.track?.kind === 'video'
					);

					if (videoSender) {
						try {
							await videoSender.replaceTrack(newTrack);
						} catch (error) {
							console.error(`Error replacing video track:`, error);
						}
					} else if (newTrack) {
						pc.addTrack(newTrack, localStreamRef.current!);
					}
				}
			);

			await Promise.all(updatePromises);
		},
		[]
	);

	const replaceAudioTrack = useCallback(
		async (newTrack: MediaStreamTrack | null) => {
			if (currentAudioTrackRef.current) {
				currentAudioTrackRef.current.stop();
			}
			currentAudioTrackRef.current = newTrack;

			const updatePromises = Array.from(peersRef.current.entries()).map(
				async ([targetUserId, pc]) => {
					const senders = pc.getSenders();
					const audioSender = senders.find(
						sender => sender.track?.kind === 'audio'
					);

					if (audioSender) {
						try {
							await audioSender.replaceTrack(newTrack);
						} catch (error) {
							console.error(`Error replacing audio track:`, error);
						}
					} else if (newTrack) {
						pc.addTrack(newTrack, localStreamRef.current!);
					}
				}
			);

			await Promise.all(updatePromises);
		},
		[]
	);

	const restoreVideoTrack = useCallback(async () => {
		if (currentVideoTrackRef.current) {
			await replaceVideoTrack(currentVideoTrackRef.current);
		} else {
			if (localStreamRef.current) {
				const videoTracks = localStreamRef.current.getVideoTracks();
				if (videoTracks.length > 0) {
					await replaceVideoTrack(videoTracks[0]);
				}
			}
		}
	}, [replaceVideoTrack]);

	const createPeerConnection = (targetUserId: string) => {
		const pc = new RTCPeerConnection({
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' },
				{
					urls: 'turn:openrelay.metered.ca:80',
					username: 'openrelayproject',
					credential: 'openrelayproject',
				},
				{
					urls: 'turn:openrelay.metered.ca:443',
					username: 'openrelayproject',
					credential: 'openrelayproject',
				},
			],
			iceTransportPolicy: 'all',
		});

		if (localStreamRef.current) {
			const tracks = localStreamRef.current.getTracks();
			tracks.forEach(track => {
				pc.addTrack(track, localStreamRef.current!);
			});
		}

		pc.ontrack = event => {
			const [remoteStream] = event.streams;
			if (remoteStream) {
				remoteStream.getTracks().forEach(track => {
					track.onmute = () => {};
					track.onunmute = () => {};
					track.onended = () => {};
				});

				setRemoteStreams(prev => new Map(prev.set(targetUserId, remoteStream)));
			} else {
				setTimeout(() => {
					if (
						peersRef.current.has(targetUserId) &&
						!remoteStreams.has(targetUserId)
					) {
						sendOffer(targetUserId);
					}
				}, 2000);
			}
		};

		pc.onicecandidate = event => {
			if (event.candidate) {
				sendMessage('ice_candidate', {
					targetUserId,
					candidate: event.candidate,
				});
			}
		};

		pc.onconnectionstatechange = () => {
			if (pc.connectionState === 'failed') {
				setTimeout(() => {
					if (peersRef.current.has(targetUserId)) {
						pc.close();
						peersRef.current.delete(targetUserId);
						sendOffer(targetUserId);
					}
				}, 2000);
			}
		};

		pc.oniceconnectionstatechange = () => {
			if (
				pc.iceConnectionState === 'disconnected' ||
				pc.iceConnectionState === 'failed'
			) {
				setTimeout(() => {
					if (peersRef.current.has(targetUserId)) {
						pc.close();
						peersRef.current.delete(targetUserId);
						sendOffer(targetUserId);
					}
				}, 3000);
			}
		};

		setPeers(prev => {
			const newPeers = new Map(prev);
			newPeers.set(targetUserId, pc);
			peersRef.current = newPeers;
			return newPeers;
		});

		return pc;
	};

	const sendOffer = async (targetUserId: string) => {
		try {
			const pc = createPeerConnection(targetUserId);
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			sendMessage('offer', {
				targetUserId,
				sdp: offer,
			});
		} catch (error) {
			console.error(`Error sending offer:`, error);
		}
	};

	const handleOffer = async (data: any) => {
		const { sdp, fromUserId } = data;

		if (fromUserId === userId) return;

		try {
			const pc = createPeerConnection(fromUserId);
			await pc.setRemoteDescription(new RTCSessionDescription(sdp));

			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			sendMessage('answer', {
				targetUserId: fromUserId,
				sdp: answer,
			});
		} catch (error) {
			console.error(`Error handling offer:`, error);
		}
	};

	const handleAnswer = async (data: any) => {
		const { sdp, fromUserId } = data;

		const pc = peersRef.current.get(fromUserId);
		if (pc) {
			try {
				await pc.setRemoteDescription(new RTCSessionDescription(sdp));
			} catch (error) {
				console.error(`Error setting remote description:`, error);
			}
		}
	};

	const handleIceCandidate = async (data: any) => {
		const { candidate, fromUserId } = data;

		const pc = peersRef.current.get(fromUserId);
		if (pc && candidate) {
			try {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			} catch (error) {
				console.error(`Error adding ICE candidate:`, error);
			}
		}
	};

	const handleNewPeer = (data: any) => {
		const { userId: newUserId } = data;

		if (newUserId !== userId) {
			sendOffer(newUserId);
		}

		setTimeout(() => {
			sendMessage('get_participants');
		}, 1500);
	};

	const replaceScreenTrack = useCallback(
		async (screenTrack: MediaStreamTrack | null) => {
			if (screenTrack && !currentVideoTrackRef.current) {
				const videoTracks = localStreamRef.current?.getVideoTracks() || [];
				if (videoTracks.length > 0) {
					currentVideoTrackRef.current = videoTracks[0];
				}
			}

			const updatePromises = Array.from(peersRef.current.entries()).map(
				async ([targetUserId, pc]) => {
					const senders = pc.getSenders();
					const videoSender = senders.find(
						sender => sender.track?.kind === 'video'
					);

					if (videoSender) {
						try {
							await videoSender.replaceTrack(screenTrack);
						} catch (error) {
							console.error(`Error setting screen track:`, error);
						}
					} else if (screenTrack) {
						pc.addTrack(screenTrack, localStreamRef.current!);
					}
				}
			);

			await Promise.all(updatePromises);
		},
		[]
	);

	const handlePeerLeft = (data: any) => {
		const { userId: leftUserId } = data;

		setPeers(prev => {
			const newPeers = new Map(prev);
			const pc = newPeers.get(leftUserId);
			if (pc) {
				pc.close();
				newPeers.delete(leftUserId);
			}
			peersRef.current = newPeers;
			return newPeers;
		});

		setRemoteStreams(prev => {
			const newStreams = new Map(prev);
			newStreams.delete(leftUserId);
			return newStreams;
		});

		setTimeout(() => {
			sendMessage('get_participants');
		}, 1000);
	};

	const handleParticipantsUpdate = (data: any) => {
		const participantsList: any[] = data.participants || [];
		const updatedParticipants: Participant[] = participantsList.map(p => ({
			...p,
			isYou: p.userId === userId,
		}));

		setParticipants(updatedParticipants);
		setParticipantsCount(data.count || 0);
	};

	const handleMediaStateUpdate = (data: any) => {
		console.log('Media state update from peer:', data);
	};

	const connectWebSocket = () => {
		if (isConnectingRef.current || ws.current?.readyState === WebSocket.OPEN) {
			return;
		}

		isConnectingRef.current = true;

		try {
			const websocket = new WebSocket(
				`ws://localhost:8080/api/ws/webrtc-plain?token=${encodeURIComponent(token)}&roomId=${roomId}&userId=${userId}`
			);

			websocket.onopen = () => {
				setIsConnected(true);
				isConnectingRef.current = false;

				sendMessage('new_peer');
				sendMessage('get_participants');

				const interval = setInterval(() => {
					if (ws.current?.readyState === WebSocket.OPEN) {
						sendMessage('get_participants');
					}
				}, 10000);

				reconnectTimeoutRef.current = interval as unknown as NodeJS.Timeout;
			};

			websocket.onmessage = event => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);

					switch (message.type) {
						case 'offer':
							handleOffer(message);
							break;
						case 'answer':
							handleAnswer(message);
							break;
						case 'ice_candidate':
							handleIceCandidate(message);
							break;
						case 'new_peer':
							handleNewPeer(message);
							break;
						case 'peer_left':
							handlePeerLeft(message);
							break;
						case 'participants_update':
							handleParticipantsUpdate(message);
							break;
						case 'participants_list':
							handleParticipantsUpdate(message);
							break;
						case 'media_state_update':
							handleMediaStateUpdate(message);
							break;
						case 'error':
							console.error('Server error:', message.error);
							break;
					}
				} catch (error) {
					console.error('Error parsing message:', error);
				}
			};

			websocket.onclose = event => {
				setIsConnected(false);
				isConnectingRef.current = false;

				if (reconnectTimeoutRef.current) {
					clearInterval(reconnectTimeoutRef.current as unknown as number);
				}
				if (event.code !== 1000) {
					const delay = Math.min(
						5000,
						1000 * Math.pow(2, reconnectTimeoutRef.current ? 1 : 0)
					);
					reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
				}
			};

			websocket.onerror = error => {
				setIsConnected(false);
				isConnectingRef.current = false;
			};

			ws.current = websocket;
		} catch (error) {
			isConnectingRef.current = false;
		}
	};

	const disconnect = () => {
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}

		sendMessage('peer_left');

		if (ws.current) {
			ws.current.close(1000, 'Normal closure');
			ws.current = null;
		}

		peersRef.current.forEach(pc => {
			pc.close();
		});
		setPeers(new Map());
		setRemoteStreams(new Map());
		setParticipants([]);
		setParticipantsCount(0);
		setIsConnected(false);
	};

	const requestParticipants = () => {
		sendMessage('get_participants');
	};

	useEffect(() => {
		connectWebSocket();

		return () => {
			disconnect();
		};
	}, [roomId, userId, token]);

	return {
		remoteStreams,
		peers,
		participants,
		participantsCount,
		isConnected,
		requestParticipants,
		notifyLeave: () => sendMessage('peer_left'),
		reconnect: connectWebSocket,
		disconnect,
		replaceAudioTrack,
		replaceVideoTrack,
		updateAllPeerConnections,
		sendMediaStateUpdate,
		replaceScreenTrack,
		restoreVideoTrack,
		debugVideoState: () => debugVideoTracks('Manual Debug'),
	};
};
