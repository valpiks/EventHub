import {
	IconMicrophone,
	IconMicrophoneOff,
	IconScreenShare,
	IconVideo,
	IconVideoOff,
} from '@tabler/icons-react';
import { Button } from '~/components/UI/button';

interface MediaControlsProps {
	isAudioEnabled: boolean;
	isVideoEnabled: boolean;
	isScreenSharing: boolean;
	onToggleAudio: () => void;
	onToggleVideo: () => void;
	onToggleScreenShare: () => void;
}

export const MediaControls = ({
	isAudioEnabled,
	isVideoEnabled,
	isScreenSharing,
	onToggleAudio,
	onToggleVideo,
	onToggleScreenShare,
}: MediaControlsProps) => {
	return (
		<div className='h-20 bg-card border border-border rounded-xl flex items-center justify-center gap-3 px-4 shrink-0 z-10'>
			<Button
				size='icon'
				variant={isVideoEnabled ? 'default' : 'destructive'}
				className='rounded-full h-12 w-12'
				onClick={onToggleVideo}
			>
				{isVideoEnabled ? (
					<IconVideo className='h-5 w-5' />
				) : (
					<IconVideoOff className='h-5 w-5' />
				)}
			</Button>

			<Button
				size='icon'
				variant={isAudioEnabled ? 'default' : 'destructive'}
				className='rounded-full h-12 w-12'
				onClick={onToggleAudio}
			>
				{isAudioEnabled ? (
					<IconMicrophone className='h-5 w-5' />
				) : (
					<IconMicrophoneOff className='h-5 w-5' />
				)}
			</Button>

			<Button
				size='icon'
				variant={isScreenSharing ? 'default' : 'outline'}
				className='rounded-full h-12 w-12'
				onClick={onToggleScreenShare}
			>
				<IconScreenShare className='h-5 w-5' />
			</Button>
		</div>
	);
};
