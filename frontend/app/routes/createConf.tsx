import { IconLock, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createRoom } from '~/api/room';
import { Header } from '~/components/Header';
import { Button } from '~/components/UI/button';

export default function CreateNewConference() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		public: false,
		maxParticipants: 10,
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async e => {
		e.preventDefault();
		const response = await createRoom(formData);
		if (response?.data?.roomUUID) {
			navigate(`/room/${response?.data?.roomUUID}`);
		}
	};

	return (
		<div className='min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4'>
			<Header />

			<div className='w-full max-w-2xl shadow-card bg-white p-4'>
				<div className='text-center'>
					<h1 className='text-3xl font-semibold'>Создание комнаты</h1>
					<p className=' text-muted-foreground'>Создаете как: ввфывфывыф</p>
				</div>
				<form onSubmit={handleSubmit} className='flex flex-col gap-4'>
					<div className='flex flex-col gap-2'>
						<label className='font-medium text-foreground'>
							Название комнаты
						</label>
						<input
							name='title'
							value={formData?.title}
							onChange={handleInputChange}
							type='text'
							placeholder='Название'
							className='w-full  px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors'
						/>
					</div>
					<div className='flex flex-col gap-2'>
						<label className='font-medium text-foreground'>Описание</label>
						<input
							name='description'
							value={formData?.description}
							onChange={handleInputChange}
							type='text'
							placeholder='Описание'
							className='w-full  px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors'
						/>
					</div>
					<div className='flex flex-col gap-2'>
						<label className='font-medium text-foreground flex gap-2 items-center'>
							<IconUsers className='w-4 h-4' />
							<span>Максимум участников</span>
						</label>
						<input
							name='maxParticipants'
							value={formData?.maxParticipants}
							onChange={handleInputChange}
							type='number'
							placeholder='Число участников'
							className='w-full  px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors'
						/>
					</div>

					<div className='border border-border rounded-lg p-4'>
						<div className='flex justify-between items-center'>
							<div className='flex items-center gap-2'>
								<IconLock className='text-muted-foreground' />
								<div>
									<h3 className='font-semibold'>Приватная комната</h3>
									<p className='text-muted-foreground'>Только по ссылке</p>
								</div>
							</div>

							<label className='relative inline-flex items-center cursor-pointer'>
								<input
									name='public'
									value={formData?.public}
									onChange={handleInputChange}
									type='checkbox'
									className='sr-only peer'
									defaultChecked
								/>
								<div className="w-11 h-6 bg-muted-foreground/30 bg-gray-400/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
							</label>
						</div>
					</div>

					<div className='bg-muted p-4 rounded-lg'>
						<p className='text-muted-foreground'>
							<span className='font-semibold'>Авторизованный режим</span>:
							Комната будет привязана к вашему профилю
						</p>
					</div>
					<div className='flex gap-4'>
						<Button
							onClick={() => navigate(-1)}
							type='button'
							variant='outline'
							size='large'
							className='flex-1'
						>
							Отмена
						</Button>
						<Button variant='default' size='large' className='flex-1'>
							Создать комнату
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
