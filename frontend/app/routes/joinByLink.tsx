import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { joinRoomByToken } from '~/api/room';
import { useAuth } from '~/context/AuthContext';

export default function JoinPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const accessToken = localStorage.getItem('token');
	const { isUserAuthorized } = useAuth();

	const urlParams = new URLSearchParams(location.search);
	const token = urlParams.get('token');

	useEffect(() => {
		const handleJoin = async () => {
			if (accessToken && isUserAuthorized) {
				try {
					if (!token) {
						navigate('/');
						return;
					}

					const response = await joinRoomByToken(token);

					if (response?.data?.roomId) {
						navigate(`/room/${response.data.roomId}`);
					} else {
						navigate('/');
					}
				} catch (error) {
					console.error('Join error:', error);
					navigate('/');
				}
			} else {
				if (token) {
					localStorage.setItem('inviteLink', token);
				}
				navigate('/join');
			}
		};

		handleJoin();
	}, [location, navigate]);

	return (
		<div className='flex items-center justify-center min-h-screen'>
			<div className='text-center'>
				<h2 className='text-xl font-semibold mb-4'>
					Присоединение к комнате...
				</h2>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
			</div>
		</div>
	);
}
