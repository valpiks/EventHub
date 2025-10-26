import { IconPlus, IconShare, IconUsers } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getUserRooms } from '~/api/room';
import { Header } from '~/components/Header';
import { InviteModal } from '~/components/modal/inviteModal';
import { Button } from '~/components/UI/button';

export default function RoomsPage() {
	const navigate = useNavigate();

	const [roomsList, setRoomsList] = useState([]);
	const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
	useEffect(() => {
		const fetchRooms = async () => {
			const response = await getUserRooms();
			setRoomsList(response.data);
		};

		fetchRooms();
	}, []);

	return (
		<div className='min-h-screen bg-background'>
			<Header />

			<main className='container mx-auto px-4 py-12 mt-20'>
				<div className='max-w-6xl mx-auto'>
					<div className='mb-12 space-y-4'>
						<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
							<div className='flex flex-col gap-2'>
								<h1 className='text-4xl font-semibold'>Конференции</h1>
								<p className='text-muted-foreground'>
									Создавате встречи и присоединяйтесь одним кликом
								</p>
							</div>
							<Button
								variant='default'
								size='large'
								onClick={() => navigate('/create-conf')}
							>
								<IconPlus className='w-5 h-5' />
								<span className='ml-2'>Создать комнату</span>
							</Button>
						</div>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
						{roomsList.map(room => (
							<>
								<div className='border border-border rounded-lg p-4 flex flex-col gap-2'>
									<div className='flex justify-between'>
										<h1 className='text-2xl font-semibold'>{room?.title}</h1>
										<Button
											onClick={() => setIsInviteModalOpen(true)}
											variant='outline'
											size='icon'
										>
											<IconShare />
										</Button>
									</div>
									<p className='text-muted-foreground'>{room?.description}</p>
									<div className='flex gap-2 text-muted-foreground'>
										<IconUsers />
										<p>8 участников</p>
									</div>
									<div></div>

									<Button
										onClick={() => navigate(`/room/${room?.roomUUID}`)}
										size='large'
										variant='default'
									>
										Присоединиться
									</Button>
								</div>

								<InviteModal
									isOpen={isInviteModalOpen}
									onClose={() => setIsInviteModalOpen(false)}
									inviteLink={room?.inviteLink}
								/>
							</>
						))}
					</div>
				</div>
			</main>
		</div>
	);
}
