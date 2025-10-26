import {
	IconCircleCheck,
	IconCrown,
	IconEdit,
	IconMessage,
	IconMicrophone,
	IconMicrophoneOff,
	IconSend,
	IconTrash,
	IconUsers,
	IconVideo,
	IconVideoOff,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

import { useChat } from '../../hooks/useChat';
import { Input } from '../UI/Input';
import { Button } from '../UI/button';

interface Participant {
	id: string;
	name?: string;
	isYou?: boolean;
	isAudioEnabled?: boolean;
	isVideoEnabled?: boolean;
}

interface ParticipantsSidebarProps {
	participants: Participant[];
	participantsCount: number;
	onRequestParticipants?: () => void;
	roomId: string;
	userId: string;
	token: string;
}

export const ParticipantsSidebar = ({
	participants,
	participantsCount,
	onRequestParticipants,
	roomId,
	userId,
	token,
}: ParticipantsSidebarProps) => {
	const [activeTab, setActiveTab] = useState<'participants' | 'chat'>(
		'participants'
	);
	const [message, setMessage] = useState('');
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const {
		messages: chatMessages,
		typingUsers,
		onlineUsers,
		isConnected: isChatConnected,
		unreadCount,
		sendChatMessage,
		startTyping,
		stopTyping,
		editMessage,
		deleteMessage,
		markAsRead,
		reconnect: reconnectChat,
		getTypingText,
	} = useChat(roomId, userId, token);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [chatMessages]);

	useEffect(() => {
		if (activeTab === 'chat') {
			markAsRead();
		}
	}, [activeTab, chatMessages, markAsRead]);

	const handleSendMessage = () => {
		if (message.trim()) {
			sendChatMessage(message.trim());
			setMessage('');
			stopTyping();
		}
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(e.target.value);
		if (e.target.value.trim()) {
			startTyping();
		} else {
			stopTyping();
		}
	};

	const handleInputBlur = () => {
		stopTyping();
	};

	const handleStartEdit = (messageId: string, currentContent: string) => {
		setEditingMessageId(messageId);
		setEditContent(currentContent);
	};

	const handleSaveEdit = () => {
		if (editingMessageId && editContent.trim()) {
			editMessage(editingMessageId, editContent.trim());
			setEditingMessageId(null);
			setEditContent('');
		}
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
		setEditContent('');
	};

	const formatTime = (timestamp: string) => {
		return new Date(timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const canEditMessage = (timestamp: string) => {
		const messageTime = new Date(timestamp).getTime();
		const now = Date.now();
		return now - messageTime < 15 * 60 * 1000;
	};

	return (
		<div className='w-80 border-l border-border bg-card backdrop-blur-sm flex flex-col shrink-0'>
			{/* Tabs */}
			<div className='flex border-b border-border relative'>
				<button
					className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
						activeTab === 'participants'
							? 'bg-primary text-primary-foreground'
							: 'hover:bg-muted'
					}`}
					onClick={() => setActiveTab('participants')}
				>
					<div className='flex items-center justify-center gap-2'>
						<IconUsers className='h-4 w-4' />
						Участники ({participantsCount})
					</div>
				</button>
				<button
					className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${
						activeTab === 'chat'
							? 'bg-primary text-primary-foreground'
							: 'hover:bg-muted'
					}`}
					onClick={() => setActiveTab('chat')}
				>
					<div className='flex items-center justify-center gap-2'>
						<IconMessage className='h-4 w-4' />
						Чат
						{unreadCount > 0 && activeTab !== 'chat' && (
							<span className='absolute top-1 right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center'>
								{unreadCount > 99 ? '99+' : unreadCount}
							</span>
						)}
					</div>
				</button>
			</div>

			{/* Content */}
			<div className='flex-1 flex flex-col min-h-0'>
				{activeTab === 'participants' ? (
					<>
						<div className='p-3 border-b border-border bg-muted/30'>
							<div className='flex items-center justify-between'>
								<span className='text-sm text-muted-foreground'>
									Участники онлайн
								</span>
								<Button
									variant='ghost'
									size='icon'
									className='h-6 w-6'
									onClick={onRequestParticipants}
								>
									<IconUsers className='h-3 w-3' />
								</Button>
							</div>
						</div>

						<div className='flex-1 overflow-y-auto p-2'>
							{participants.map(participant => (
								<div
									key={participant.id}
									className={`flex items-center gap-3 p-3 rounded-lg mb-1 ${
										participant.isYou
											? 'bg-primary/10 border border-primary/20'
											: 'hover:bg-muted'
									}`}
								>
									<div className='w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium'>
										{participant?.name?.charAt(0).toUpperCase() || 'U'}
									</div>

									<div className='flex-1 min-w-0'>
										<div className='text-sm font-medium truncate'>
											{participant.name || `Участник ${participant.id}`}
											{participant.isYou && ' (Вы)'}
										</div>
										<div className='text-xs text-muted-foreground'>
											{participant.isYou ? 'Вы в сети' : 'В сети'}
										</div>
									</div>

									<div className='flex items-center gap-2'>
										{participant.audioEnabled ? (
											<IconMicrophone className='h-4 w-4 text-green-500' />
										) : (
											<IconMicrophoneOff className='h-4 w-4 text-destructive' />
										)}
										{participant.videoEnabled ? (
											<IconVideo className='h-4 w-4 text-green-500' />
										) : (
											<IconVideoOff className='h-4 w-4 text-destructive' />
										)}
										{participant.role === 'HOST' ? (
											<IconCrown className='w-4 h-4 text-primary' />
										) : (
											<div
												className={`w-2 h-2 rounded-full ${
													participant.isYou ? 'bg-green-500' : 'bg-blue-500'
												}`}
											/>
										)}
									</div>
								</div>
							))}

							{participants.length === 0 && (
								<div className='text-center text-muted-foreground py-8'>
									<IconUsers className='h-12 w-12 mx-auto mb-2 opacity-50' />
									<p className='text-sm'>Нет участников онлайн</p>
								</div>
							)}
						</div>
					</>
				) : (
					<>
						<div className='p-3 border-b border-border bg-muted/30'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<span className='text-sm text-muted-foreground'>
										Чат комнаты
									</span>
									<div
										className={`w-2 h-2 rounded-full ${
											isChatConnected ? 'bg-green-500' : 'bg-destructive'
										}`}
									/>
								</div>
							</div>
						</div>

						{/* Chat Messages */}
						<div className='flex-1 overflow-y-auto p-3'>
							{chatMessages.length === 0 ? (
								<div className='text-center text-muted-foreground py-8'>
									<IconMessage className='h-12 w-12 mx-auto mb-2 opacity-50' />
									<p className='text-sm'>Нет сообщений</p>
									<p className='text-xs mt-1'>Начните общение первым!</p>
								</div>
							) : (
								<div className='space-y-4'>
									{chatMessages.map(message => (
										<div
											key={message.uuid}
											className={`flex flex-col ${
												message.senderEmail === userId
													? 'items-end'
													: 'items-start'
											}`}
										>
											{message.type === 'SYSTEM' ? (
												<div className='text-center w-full'>
													<span className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full'>
														{message.content}
													</span>
												</div>
											) : (
												<div className='flex items-start gap-2 group w-full max-w-[85%]'>
													{message.senderEmail !== userId &&
														message.senderAvatar && (
															<img
																src={message.senderAvatar}
																alt={message.senderName}
																className='w-6 h-6 rounded-full mt-1'
															/>
														)}

													<div className='flex-1'>
														<div className='flex items-center gap-2 mb-1'>
															<span
																className={`text-xs ${
																	message.senderEmail === userId
																		? 'text-primary'
																		: 'text-muted-foreground'
																}`}
															>
																{message.senderName}
															</span>
															<span className='text-xs text-muted-foreground'>
																{formatTime(message.timestamp)}
															</span>
															{message.edited && (
																<span className='text-xs text-muted-foreground'>
																	(ред.)
																</span>
															)}
														</div>

														{editingMessageId === message.uuid ? (
															<div className='flex flex-col gap-2'>
																<Input
																	value={editContent}
																	onChange={e => setEditContent(e.target.value)}
																	onKeyDown={e => {
																		if (e.key === 'Enter') handleSaveEdit();
																		if (e.key === 'Escape') handleCancelEdit();
																	}}
																	autoFocus
																	className='text-sm'
																/>
																<div className='flex gap-2'>
																	<Button
																		size='small'
																		onClick={handleSaveEdit}
																		className='h-7 text-xs'
																	>
																		<IconCircleCheck className='h-3 w-3 mr-1' />
																		Сохранить
																	</Button>
																	<Button
																		size='small'
																		variant='outline'
																		onClick={handleCancelEdit}
																		className='h-7 text-xs'
																	>
																		Отмена
																	</Button>
																</div>
															</div>
														) : (
															<div className='relative group'>
																<div
																	className={`rounded-lg px-3 py-2 ${
																		message.senderEmail === userId
																			? 'bg-primary text-primary-foreground'
																			: 'bg-muted'
																	}`}
																>
																	{message.replyTo && (
																		<div className='text-xs opacity-75 border-l-2 border-muted-foreground pl-2 mb-1'>
																			Ответ для: {message.repliedMessageContent}
																		</div>
																	)}
																	<p className='text-sm break-words'>
																		{message.content}
																	</p>
																</div>

																{message.senderEmail === userId &&
																	message.type === 'TEXT' && (
																		<div className='absolute -right-8 top-1/2 transform -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-lg p-1'>
																			{canEditMessage(message.timestamp) && (
																				<Button
																					variant='ghost'
																					size='icon'
																					className='h-6 w-6'
																					onClick={() =>
																						handleStartEdit(
																							message.uuid,
																							message.content
																						)
																					}
																					title='Редактировать'
																				>
																					<IconEdit className='h-3 w-3' />
																				</Button>
																			)}
																			<Button
																				variant='ghost'
																				size='icon'
																				className='h-6 w-6 text-destructive'
																				onClick={() =>
																					deleteMessage(message.uuid)
																				}
																				title='Удалить'
																			>
																				<IconTrash className='h-3 w-3' />
																			</Button>
																		</div>
																	)}
															</div>
														)}
													</div>

													{message.senderEmail === userId &&
														message.senderAvatar && (
															<img
																src={message.senderAvatar}
																alt={message.senderName}
																className='w-6 h-6 rounded-full mt-1'
															/>
														)}
												</div>
											)}
										</div>
									))}
								</div>
							)}

							{typingUsers.length > 0 && (
								<div className='mt-4 p-2 bg-muted/50 rounded-lg border border-border'>
									<div className='flex items-center gap-2'>
										<div className='flex space-x-1'>
											<div className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'></div>
											<div
												className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
												style={{ animationDelay: '0.1s' }}
											></div>
											<div
												className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
												style={{ animationDelay: '0.2s' }}
											></div>
										</div>
										<span className='text-xs text-muted-foreground italic'>
											{getTypingText()}
										</span>
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>

						{/* Chat Input */}
						<div className='p-3 border-t border-border'>
							<div className='flex gap-2'>
								<Input
									value={message}
									onChange={handleMessageChange}
									onKeyDown={handleKeyPress}
									onBlur={handleInputBlur}
									placeholder={
										isChatConnected ? 'Введите сообщение...' : 'Чат отключен...'
									}
									className='flex-1'
									disabled={!isChatConnected}
								/>
								<Button
									size='icon'
									onClick={handleSendMessage}
									disabled={!message.trim() || !isChatConnected}
								>
									<IconSend className='h-4 w-4' />
								</Button>
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
};
