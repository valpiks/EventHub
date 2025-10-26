import { useEffect, useState } from 'react';

export const useVoiceActivity = (audioStream: MediaStream | null) => {
	const [isSpeaking, setIsSpeaking] = useState(false);

	useEffect(() => {
		if (!audioStream || audioStream.getAudioTracks().length === 0) {
			setIsSpeaking(false);
			return;
		}

		let audioContext: AudioContext | null = null;
		let analyser: AnalyserNode | null = null;
		let source: MediaStreamAudioSourceNode | null = null;
		let animationFrameId: number;

		const initAudioAnalysis = async () => {
			try {
				audioContext = new AudioContext();
				analyser = audioContext.createAnalyser();
				source = audioContext.createMediaStreamSource(audioStream);

				source.connect(analyser);
				analyser.fftSize = 256;

				const bufferLength = analyser.frequencyBinCount;
				const dataArray = new Uint8Array(bufferLength);

				const checkVolume = () => {
					if (!analyser) return;

					analyser.getByteFrequencyData(dataArray);

					let sum = 0;
					for (let i = 0; i < bufferLength; i++) {
						sum += dataArray[i];
					}
					const average = sum / bufferLength;

					const speaking = average > 30;
					setIsSpeaking(speaking);

					animationFrameId = requestAnimationFrame(checkVolume);
				};

				checkVolume();
			} catch (error) {
				console.error('Error initializing voice activity detection:', error);
				setIsSpeaking(false);
			}
		};

		initAudioAnalysis();

		return () => {
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
			}
			if (source) {
				source.disconnect();
			}
			if (audioContext) {
				audioContext.close();
			}
		};
	}, [audioStream]);

	return isSpeaking;
};
