import { IconMicrophoneOff } from '@tabler/icons-react';
import { useEffect, useRef } from 'react';

interface UserVideoProps {
	userId: string;
	userName: string;
	stream: MediaStream | null;
	isYou: boolean;
	isAudioEnabled: boolean;
	isVideoEnabled: boolean;
	isSpeaking?: boolean;
	onClick?: () => void;
	avatarSize?: 'sm' | 'md' | 'lg';
}

export const UserVideo = ({
	userId,
	userName,
	stream,
	isYou,
	isAudioEnabled,
	isVideoEnabled,
	isSpeaking = false,
	onClick,
	avatarSize = 'md',
}: UserVideoProps) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
		}
	}, [stream]);

	const getAvatarSize = () => {
		switch (avatarSize) {
			case 'sm':
				return 'w-16 h-16 text-lg';
			case 'md':
				return 'w-24 h-24 text-2xl';
			case 'lg':
				return 'w-32 h-32 text-4xl';
			default:
				return 'w-24 h-24 text-2xl';
		}
	};

	const getInitials = () => {
		return userName
			?.split(' ')
			.map(word => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div
			className={`rounded-xl overflow-hidden cursor-pointer transition-all relative ${
				isSpeaking && 'ring-4 ring-primary'
			}`}
			onClick={onClick}
		>
			{isVideoEnabled && stream ? (
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted={isYou}
					className='w-full h-full object-cover rounded-lg'
				/>
			) : (
				<div className='relative w-full h-full bg-muted rounded-lg'>
					<div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 rounded-lg'>
						<div
							className={`${getAvatarSize()} rounded-full border-4 border-background`}
						>
							<div className='rounded-full flex items-center justify-center text-primary bg-orange-500/30 uppercase h-full w-full overflow-hidden'>
								{getInitials()}
							</div>
						</div>
					</div>
				</div>
			)}

			<div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 rounded-b-lg'>
				<div className='flex items-center justify-between'>
					<span className='text-white font-medium text-sm'>
						{userName} {isYou && '(Вы)'}
					</span>
					{!isAudioEnabled && (
						<div className='bg-destructive rounded-full p-1'>
							<IconMicrophoneOff className='h-4 w-4 text-white' />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
