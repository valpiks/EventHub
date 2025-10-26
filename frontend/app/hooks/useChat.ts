import { useCallback, useEffect, useRef, useState } from 'react';

interface ChatMessage {
	uuid: string;
	content: string;
	type: 'TEXT' | 'SYSTEM';
	timestamp: string;
	edited: boolean;
	editedAt?: string;
	replyTo?: string;
	senderName: string;
	senderEmail: string;
	senderAvatar?: string;
	repliedMessageContent?: string;
	repliedMessageSender?: string;
}

interface UserTyping {
	userEmail: string;
	userName: string;
	typing: boolean;
	timestamp: string;
}

interface ChatUser {
	id: string;
	name: string;
	email: string;
	avatar?: string;
}

interface WebSocketMessage {
	type: string;
	[key: string]: any;
}

export const useChat = (roomId: string, userId: string, token: string) => {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [typingUsers, setTypingUsers] = useState<UserTyping[]>([]);
	const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
	const [isConnected, setIsConnected] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	const ws = useRef<WebSocket | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
	const isConnectingRef = useRef(false);
	const typingTimeoutRef = useRef<NodeJS.Timeout>();
	const lastReadTimeRef = useRef<number>(Date.now());

	useEffect(() => {
		console.log('💬 CHAT STATE:', {
			messagesCount: messages.length,
			typingUsers: typingUsers.length,
			onlineUsers: onlineUsers.length,
			unreadCount,
			isConnected,
		});
	}, [messages, typingUsers, onlineUsers, unreadCount, isConnected]);

	const sendMessage = useCallback(
		(type: string, payload: any = {}) => {
			if (ws.current?.readyState === WebSocket.OPEN) {
				const message = {
					type,
					roomId,
					userId,
					...payload,
					timestamp: Date.now(),
				};
				console.log('📤 CHAT SENDING:', type, payload);
				ws.current.send(JSON.stringify(message));
			} else {
				console.warn('❌ Chat WebSocket not connected, cannot send:', type);
			}
		},
		[roomId, userId]
	);

	const sendChatMessage = useCallback(
		(content: string, replyTo?: string) => {
			console.log('💬 SENDING CHAT MESSAGE:', { content, replyTo });
			sendMessage('chat_message', {
				content: content.trim(),
				replyTo,
			});
		},
		[sendMessage]
	);

	const startTyping = useCallback(() => {
		console.log('⌨️ START TYPING');
		sendMessage('chat_typing_start');

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
		typingTimeoutRef.current = setTimeout(() => {
			stopTyping();
		}, 3000);
	}, [sendMessage]);

	const stopTyping = useCallback(() => {
		console.log('⏹️ STOP TYPING');
		sendMessage('chat_typing_stop');

		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}
	}, [sendMessage]);

	const editMessage = useCallback(
		(messageId: string, newContent: string) => {
			console.log('✏️ EDITING MESSAGE:', { messageId, newContent });
			sendMessage('chat_edit_message', {
				messageId,
				content: newContent.trim(),
			});
		},
		[sendMessage]
	);

	const deleteMessage = useCallback(
		(messageId: string) => {
			console.log('🗑️ DELETING MESSAGE:', messageId);
			sendMessage('chat_delete_message', {
				messageId,
			});
		},
		[sendMessage]
	);

	const loadChatHistory = useCallback(() => {
		console.log('📜 LOADING CHAT HISTORY');
		sendMessage('chat_get_history');
	}, [sendMessage]);

	const markAsRead = useCallback(
		(messageId?: string) => {
			if (messageId) {
				sendMessage('chat_mark_read', { messageId });
			}
			lastReadTimeRef.current = Date.now();
			setUnreadCount(0);
		},
		[sendMessage]
	);

	const handleChatMessage = useCallback((data: any) => {
		console.log('💬 RECEIVED CHAT MESSAGE:', data);
		const message: ChatMessage = data.message;

		setMessages(prev => {
			const exists = prev.some(m => m.uuid === message.uuid);
			if (exists) {
				console.log('⚠️ Duplicate message, skipping');
				return prev;
			}

			const newMessages = [...prev, message];

			return newMessages.sort(
				(a, b) =>
					new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
			);
		});

		if (new Date(message.timestamp).getTime() > lastReadTimeRef.current) {
			setUnreadCount(prev => prev + 1);
		}
	}, []);

	const handleChatMessageEdited = useCallback((data: any) => {
		console.log('✏️ MESSAGE EDITED:', data);
		const updatedMessage: ChatMessage = data.message;

		setMessages(prev =>
			prev.map(msg => (msg.uuid === updatedMessage.uuid ? updatedMessage : msg))
		);
	}, []);

	const handleChatMessageDeleted = useCallback((data: any) => {
		console.log('🗑️ MESSAGE DELETED:', data);
		const { messageId } = data;

		setMessages(prev => prev.filter(msg => msg.uuid !== messageId));
	}, []);

	const handleChatHistory = useCallback((data: any) => {
		console.log(
			'📜 CHAT HISTORY LOADED:',
			data.messages?.length || 0,
			'messages'
		);
		const history: ChatMessage[] = data.messages || [];

		setMessages(history);

		setUnreadCount(0);
		lastReadTimeRef.current = Date.now();
	}, []);

	const handleChatTyping = useCallback((data: any) => {
		console.log('⌨️ TYPING UPDATE:', data);
		const { user, typing, timestamp } = data;

		setTypingUsers(prev => {
			const filtered = prev.filter(u => u.userEmail !== user.email);

			if (typing) {
				return [
					...filtered,
					{
						userEmail: user.email,
						userName: user.name,
						typing: true,
						timestamp,
					},
				];
			}

			return filtered;
		});

		if (typing) {
			setTimeout(() => {
				setTypingUsers(prev =>
					prev.filter(u => !(u.userEmail === user.email && u.typing))
				);
			}, 3000);
		}
	}, []);

	const handleChatUserJoined = useCallback((data: any) => {
		console.log('👤 USER JOINED CHAT:', data);
		const { user } = data;

		setOnlineUsers(prev => {
			const exists = prev.some(u => u.id === user.id);
			if (exists) return prev;

			return [
				...prev,
				{
					id: user.id,
					name: user.name,
					email: user.email,
					avatar: user.avatar,
				},
			];
		});

		const systemMessage: ChatMessage = {
			uuid: `system-join-${Date.now()}`,
			content: `${user.name} присоединился к чату`,
			type: 'SYSTEM',
			timestamp: new Date().toISOString(),
			edited: false,
			senderName: 'System',
			senderEmail: 'system',
		};

		setMessages(prev => [...prev, systemMessage]);
	}, []);

	const handleChatUserLeft = useCallback((data: any) => {
		console.log('👤 USER LEFT CHAT:', data);
		const { user } = data;

		setOnlineUsers(prev => prev.filter(u => u.id !== user.id));

		setTypingUsers(prev => prev.filter(u => u.userEmail !== user.email));

		const systemMessage: ChatMessage = {
			uuid: `system-left-${Date.now()}`,
			content: `${user.name} покинул чат`,
			type: 'SYSTEM',
			timestamp: new Date().toISOString(),
			edited: false,
			senderName: 'System',
			senderEmail: 'system',
		};

		setMessages(prev => [...prev, systemMessage]);
	}, []);

	const handleError = useCallback((data: any) => {
		console.error('❌ CHAT ERROR:', data.message);
	}, []);

	const connectWebSocket = useCallback(() => {
		if (isConnectingRef.current || ws.current?.readyState === WebSocket.OPEN) {
			console.log('⚠️ Chat WebSocket already connected or connecting');
			return;
		}

		console.log('🔄 CONNECTING CHAT WEBSOCKET...');
		isConnectingRef.current = true;

		try {
			const websocket = new WebSocket(
				`ws://localhost:8080/ws-chat?token=${encodeURIComponent(token)}&roomId=${roomId}&userId=${userId}`
			);

			websocket.onopen = () => {
				console.log('✅ CHAT WEBSOCKET CONNECTED');
				setIsConnected(true);
				isConnectingRef.current = false;

				loadChatHistory();
			};

			websocket.onmessage = event => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					console.log('📨 CHAT RECEIVED:', message.type, message);

					switch (message.type) {
						case 'chat_message':
							handleChatMessage(message);
							break;
						case 'chat_message_edited':
							handleChatMessageEdited(message);
							break;
						case 'chat_message_deleted':
							handleChatMessageDeleted(message);
							break;
						case 'chat_history':
							handleChatHistory(message);
							break;
						case 'chat_typing':
							handleChatTyping(message);
							break;
						case 'chat_user_joined':
							handleChatUserJoined(message);
							break;
						case 'chat_user_left':
							handleChatUserLeft(message);
							break;
						case 'error':
							handleError(message);
							break;
						default:
							console.warn('⚠️ UNKNOWN CHAT MESSAGE TYPE:', message.type);
					}
				} catch (error) {
					console.error('❌ ERROR PARSING CHAT MESSAGE:', error);
				}
			};

			websocket.onclose = event => {
				console.log(
					'🔌 CHAT WEBSOCKET DISCONNECTED:',
					event.code,
					event.reason
				);
				setIsConnected(false);
				isConnectingRef.current = false;

				if (event.code !== 1000) {
					const delay = Math.min(
						5000,
						1000 * Math.pow(2, reconnectTimeoutRef.current ? 1 : 0)
					);
					console.log(`🔄 CHAT RECONNECTING IN ${delay}ms...`);
					reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
				}
			};

			websocket.onerror = error => {
				console.error('❌ CHAT WEBSOCKET ERROR:', error);
				setIsConnected(false);
				isConnectingRef.current = false;
			};

			ws.current = websocket;
		} catch (error) {
			console.error('❌ ERROR CREATING CHAT WEBSOCKET:', error);
			isConnectingRef.current = false;
		}
	}, [
		roomId,
		userId,
		token,
		loadChatHistory,
		handleChatMessage,
		handleChatMessageEdited,
		handleChatMessageDeleted,
		handleChatHistory,
		handleChatTyping,
		handleChatUserJoined,
		handleChatUserLeft,
		handleError,
	]);

	const disconnect = useCallback(() => {
		console.log('🛑 DISCONNECTING CHAT');
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
		}
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current);
		}

		stopTyping();

		if (ws.current) {
			ws.current.close(1000, 'Normal closure');
			ws.current = null;
		}

		setMessages([]);
		setTypingUsers([]);
		setOnlineUsers([]);
		setUnreadCount(0);
		setIsConnected(false);
	}, [stopTyping]);

	useEffect(() => {
		connectWebSocket();

		return () => {
			disconnect();
		};
	}, [connectWebSocket, disconnect]);

	return {
		messages,
		typingUsers,
		onlineUsers,
		isConnected,
		unreadCount,

		sendChatMessage,
		startTyping,
		stopTyping,
		editMessage,
		deleteMessage,
		loadChatHistory,
		markAsRead,
		reconnect: connectWebSocket,
		disconnect,

		getTypingText: () => {
			if (typingUsers.length === 0) return '';
			if (typingUsers.length === 1)
				return `${typingUsers[0].userName} печатает...`;
			if (typingUsers.length === 2)
				return `${typingUsers[0].userName} и ${typingUsers[1].userName} печатают...`;
			return `${typingUsers.length} человека печатают...`;
		},
	};
};
