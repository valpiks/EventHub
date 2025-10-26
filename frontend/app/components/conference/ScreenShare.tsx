import { useEffect, useRef } from 'react';

interface ScreenShareProps {
	stream: MediaStream | null;
	onClick?: () => void;
}

export const ScreenShare = ({ stream, onClick }: ScreenShareProps) => {
	const screenRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (screenRef.current && stream) {
			screenRef.current.srcObject = stream;
		}
	}, [stream]);

	if (!stream) return null;

	return (
		<div
			className='rounded-xl overflow-hidden cursor-pointer transition-all border-2 border-primary'
			onClick={onClick}
		>
			<div className='relative w-full h-full'>
				<video
					ref={screenRef}
					autoPlay
					muted
					playsInline
					className='w-full h-full object-contain rounded-lg bg-black'
				/>
				<div className='absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium'>
					🖥️ Ваш экран
				</div>
			</div>
		</div>
	);
};
