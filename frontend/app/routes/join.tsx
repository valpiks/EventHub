import {
	IconArrowLeft,
	IconBrandTelegram,
	IconCamera,
	IconLink,
	IconMicrophone,
	IconUpload,
	IconUser,
	IconVideo,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { joinByGuest, joinDirectByLink } from '~/api/room';
import { Button } from '~/components/UI/button';
import { ThemeToggle } from '~/components/UI/themeToggle';
import { useAuth } from '~/context/AuthContext';

export default function JoinPage() {
	const navigate = useNavigate();
	const { isUserAuthorized, user, setUser, setIsUserAuthorized } = useAuth();
	const [formData, setFormData] = useState({
		guestName: '',
		roomInviteLink: '',
	});

	useEffect(() => {
		if (!isUserAuthorized) {
			const token = localStorage.getItem('inviteLink');
			if (token) {
				setFormData(prev => ({
					...prev,
					roomInviteLink: `${window.location.origin}/invite?token=${token}`,
				}));
			}
		}
	}, []);

	const handleSubmit = async e => {
		e.preventDefault();
		const token = localStorage.getItem('inviteLink');
		let response;

		try {
			if (isUserAuthorized) {
				response = await joinDirectByLink(formData?.roomInviteLink);
			} else {
				response = await joinByGuest(formData);
			}

			if (response?.data) {
				if (token) {
					localStorage.setItem('token', response.data.accessToken);
					localStorage.removeItem('inviteLink');
				}

				setUser(response.data);
				setIsUserAuthorized(true);
				navigate(`/room/${response.data.room.roomUUID}`);
			}
		} catch (error) {
			console.error('Error joining room:', error);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4'>
			<header className='fixed top-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md z-50 border-b border-border'>
				<div className='container mx-auto flex justify-between items-center'>
					<Link
						to='/'
						className='flex items-center gap-2 text-xl font-bold hover:opacity-80 transition-opacity'
					>
						<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground'>
							<IconBrandTelegram className='w-5 h-5' />
						</div>
						ConferHub
					</Link>

					<div className='flex gap-4 items-center'>
						<ThemeToggle />
						<Link
							to='/'
							className='flex items-center gap-2 px-4 py-2 rounded-md text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium'
						>
							<IconArrowLeft className='w-4 h-4' />
							На главную
						</Link>
					</div>
				</div>
			</header>

			<div className='w-full max-w-6xl'>
				{/* Хедер */}
				<div className='bg-gradient-primary p-8 text-center rounded-t-2xl'>
					<h1 className='text-2xl font-bold mb-2 '>
						Присоединиться к конференции
					</h1>
					<p className='text-foreground'>Настройте параметры перед входом</p>
				</div>

				{/* Основной контент */}
				<div className='bg-card rounded-b-2xl shadow-card border border-border border-t-0'>
					<div className='grid grid-cols-1 lg:grid-cols-2 divide-x-0 lg:divide-x divide-border'>
						{/* Левая колонка - настройки медиа */}
						<div className='p-8'>
							<div className='space-y-6 h-full'>
								{/* Preview камеры */}
								<div className='bg-muted rounded-xl h-48 flex items-center justify-center mb-6'>
									<div className='text-center'>
										<IconCamera className='h-16 w-16 text-muted-foreground mx-auto mb-2' />
										<p className='text-sm text-muted-foreground'>
											Предпросмотр камеры
										</p>
									</div>
								</div>

								{/* Тумблер камеры */}
								<div className='flex items-center justify-between p-4 bg-background rounded-lg border border-border mb-4'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
											<IconVideo className='h-5 w-5 text-primary' />
										</div>
										<div>
											<div className='font-medium text-foreground'>Камера</div>
											<div className='text-sm text-muted-foreground'>
												Включить видео
											</div>
										</div>
									</div>
									<label className='relative inline-flex items-center cursor-pointer'>
										<input
											type='checkbox'
											className='sr-only peer'
											defaultChecked
										/>
										<div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>

								{/* Тумблер микрофона */}
								<div className='flex items-center justify-between p-4 bg-background rounded-lg border border-border'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center'>
											<IconMicrophone className='h-5 w-5 text-primary' />
										</div>
										<div>
											<div className='font-medium text-foreground'>
												Микрофон
											</div>
											<div className='text-sm text-muted-foreground'>
												Включить звук
											</div>
										</div>
									</div>
									<label className='relative inline-flex items-center cursor-pointer'>
										<input
											type='checkbox'
											className='sr-only peer'
											defaultChecked
										/>
										<div className="w-11 h-6 bg-muted-foreground/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
									</label>
								</div>
							</div>
						</div>
						<form onClick={handleSubmit}>
							{/* Правая колонка - настройки профиля */}
							<div className='p-8'>
								<div className='space-y-6 h-full'>
									{/* Секция настроек */}
									{isUserAuthorized ? (
										<div>
											<h2 className='text-lg font-semibold text-foreground mb-4'>
												Настройки входа
											</h2>
											<div>
												<div className='bg-muted p-4 rounded-lg border border-primary flex flex-col gap-2'>
													<div className='flex gap-4 items-center'>
														<div className='rounded-full bg-primary text-white w-12 h-12 flex items-center justify-center uppercase'>
															{user?.name
																.split(' ')
																.map(i => i[0])
																.join('')}
														</div>
														<div>
															<h3 className='text-lg font-semibold'>
																{user?.name}
															</h3>
															<p className='text-sm text-muted-foreground'>
																Данные из профиля
															</p>
														</div>
													</div>
													<div>
														<p className='text-xs text-muted-foreground'>
															Ваше имя и аватар загружены автоматически
														</p>
													</div>
												</div>
											</div>
										</div>
									) : (
										<div>
											<h2 className='text-lg font-semibold text-foreground mb-4'>
												Настройки входа
											</h2>

											{/* Поле имени */}
											<div className='space-y-3 mb-6'>
												<label className='text-sm font-medium text-foreground'>
													Ваше имя
												</label>
												<div className='relative'>
													<IconUser className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
													<input
														name='guestName'
														value={formData.guestName}
														onChange={handleInputChange}
														type='text'
														placeholder='Введите ваше имя'
														className='w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors'
													/>
												</div>
											</div>

											{/* Аватар */}
											<div className='space-y-3'>
												<label className='text-sm font-medium text-foreground'>
													Аватар
												</label>
												<div className='flex items-center gap-4'>
													<div className='w-20 h-20 bg-muted rounded-xl flex items-center justify-center border-2 border-dashed border-border'>
														<IconUser className='h-8 w-8 text-muted-foreground' />
													</div>
													<div className='flex-1'>
														<Button variant='outline' className='w-full'>
															<IconUpload className='h-4 w-4 mr-2' />
															Загрузить фото
														</Button>
														<p className='text-xs text-muted-foreground mt-2'>
															JPG, PNG до 2MB
														</p>
													</div>
												</div>
											</div>
										</div>
									)}

									<div className='border-t border-border'></div>

									<div className='space-y-3'>
										<label className='text-sm font-medium text-foreground'>
											Ссылка на конференцию
										</label>
										<div className='relative'>
											<IconLink className='absolute top-3.5 left-3 text-gray-400' />
											<input
												name='roomInviteLink'
												value={formData?.roomInviteLink}
												onChange={handleInputChange}
												type='text'
												placeholder='https://conference.app/abc123'
												className='w-full pl-10 pr-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors'
											/>
										</div>
									</div>

									<div className='border-t border-border'></div>

									<Button
										className='w-full py-3 text-base font-semibold shadow-glow hover:shadow-glow transition-all duration-200'
										size='large'
									>
										Войти в конференцию
									</Button>
								</div>
							</div>
						</form>
					</div>
				</div>

				<div className='text-center mt-6'>
					<p className='text-sm text-muted-foreground'>
						Присоединяясь, вы соглашаетесь с нашими правилами конференции
					</p>
				</div>
			</div>
		</div>
	);
}
