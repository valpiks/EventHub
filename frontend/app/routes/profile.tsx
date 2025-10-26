import { useEffect, useState } from 'react';
import { getUserProfile } from '~/api/auth';
import { Header } from '~/components/Header';
import { Button } from '~/components/UI/button';
import { Input } from '~/components/UI/Input';

export default function ProfilePage() {
	const [userData, setUserData] = useState(null);
	const [formData, setFormData] = useState({
		name: userData?.name,
		email: userData?.email,
		createdAt: userData?.createdAt,
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const setDefaultUserData = data => {
		setFormData({
			name: data?.name,
			email: data?.email,
			createdAt: data?.createdAt,
		});
	};

	useEffect(() => {
		const getUser = async () => {
			const response = await getUserProfile();
			setUserData(response.data);
			setDefaultUserData(response.data);
		};

		getUser();
	}, []);

	const handleSubmit = e => {
		e.preventDefault();
		console.log('change');
	};

	return (
		<div className='min-h-screen bg-background'>
			<Header />

			<main className='container mx-auto px-4 py-12 mt-20'>
				<div className='max-w-3xl mx-auto'>
					<h1 className='text-4xl font-bold mb-8'>Профиль</h1>

					<div className='bg-card border border-border rounded-2xl p-8 shadow-card'>
						<div className='flex justify-center mb-8'>
							<div className='flex flex-col gap-2 items-center text-center'>
								<div className='bg-muted border border-primary rounded-full w-20 h-20 flex items-center justify-center text-primary text-2xl'>
									{userData?.name
										.split(' ')
										.map(word => word[0])
										.join('')
										.toUpperCase()
										.slice(0, 2)}
								</div>
								<div>
									<h1 className='text-3xl font-semibold'>{userData?.name}</h1>
									<p className='text-muted-foreground'>{userData?.email}</p>
								</div>
							</div>
						</div>

						<form onSubmit={handleSubmit} className='flex flex-col gap-4'>
							<label htmlFor='name'>
								<span>Имя</span>
								<Input
									name='name'
									value={formData?.name}
									onChange={handleInputChange}
								/>
							</label>
							<label htmlFor='email'>
								<span>Email</span>
								<Input
									name='email'
									type='email'
									value={formData?.email}
									onChange={handleInputChange}
								/>
							</label>
							<label htmlFor='date'>
								<span>Дата регистрации</span>
								<Input
									name='date'
									type='date'
									disabled
									defaultValue={new Date(
										userData?.createdAt
									).toLocaleDateString('ru-RU')}
								/>
							</label>
							<div className='flex gap-4'>
								<Button className='flex-1'>Сохранить</Button>
								<Button
									onClick={() => setDefaultUserData(userData)}
									variant='outline'
									className='flex-1'
								>
									Отменить
								</Button>
							</div>
						</form>
					</div>
				</div>
			</main>
		</div>
	);
}
