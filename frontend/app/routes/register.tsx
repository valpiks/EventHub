import {
	IconArrowLeft,
	IconBrandTelegram,
	IconEye,
	IconEyeOff,
	IconLock,
	IconMail,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { register } from '~/api/auth';
import { ThemeToggle } from '~/components/UI/themeToggle';

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const response = await register(formData);
	};

	const doPasswordsMatch = formData.password === formData.confirmPassword;

	return (
		<div className='min-h-screen bg-gradient-hero'>
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

			<section className='min-h-screen flex items-center justify-center pt-20 pb-10'>
				<div className='container mx-auto px-4'>
					<div className='max-w-md mx-auto'>
						<div className='bg-card border border-border rounded-2xl shadow-card p-8'>
							<div className='text-center mb-8'>
								<h1 className='text-3xl font-bold mb-2'>Создать аккаунт</h1>
								<p className='text-muted-foreground'>
									Заполните форму для регистрации
								</p>
							</div>

							<form onSubmit={handleSubmit} className='space-y-6'>
								<div>
									<label className='block text-sm font-medium mb-2'>Имя</label>
									<input
										name='name'
										type='text'
										required
										value={formData.name}
										onChange={handleInputChange}
										className='block w-full px-3 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300'
										placeholder='Иванов Иван Иванович'
									/>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2'>
										Email
									</label>
									<div className='relative'>
										<IconMail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground' />
										<input
											name='email'
											type='email'
											required
											value={formData.email}
											onChange={handleInputChange}
											className='block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300'
											placeholder='your@email.com'
										/>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2'>
										Пароль
									</label>
									<div className='relative'>
										<IconLock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground' />
										<input
											name='password'
											type={showPassword ? 'text' : 'password'}
											required
											value={formData.password}
											onChange={handleInputChange}
											className='block w-full pl-10 pr-12 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300'
											placeholder='Пароль'
										/>
										<button
											type='button'
											onClick={() => setShowPassword(!showPassword)}
											className='absolute right-3 top-1/2 transform -translate-y-1/2'
										>
											{showPassword ? (
												<IconEyeOff className='h-5 w-5 text-muted-foreground hover:text-primary transition-colors' />
											) : (
												<IconEye className='h-5 w-5 text-muted-foreground hover:text-primary transition-colors' />
											)}
										</button>
									</div>
								</div>

								<div>
									<label className='block text-sm font-medium mb-2'>
										Подтверждение пароля
									</label>
									<div className='relative'>
										<IconLock className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground' />
										<input
											name='confirmPassword'
											type={showConfirmPassword ? 'text' : 'password'}
											required
											value={formData.confirmPassword}
											onChange={handleInputChange}
											className={`block w-full pl-10 pr-12 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300 ${
												formData.confirmPassword
													? doPasswordsMatch
														? 'border-green-500'
														: 'border-red-500'
													: 'border-border'
											}`}
											placeholder='Подтвердите пароль'
										/>
										<button
											type='button'
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
											className='absolute right-3 top-1/2 transform -translate-y-1/2'
										>
											{showConfirmPassword ? (
												<IconEyeOff className='h-5 w-5 text-muted-foreground hover:text-primary transition-colors' />
											) : (
												<IconEye className='h-5 w-5 text-muted-foreground hover:text-primary transition-colors' />
											)}
										</button>
									</div>
									{formData.confirmPassword && !doPasswordsMatch && (
										<p className='mt-2 text-sm text-red-500'>
											Пароли не совпадают
										</p>
									)}
								</div>

								<div className='flex items-start'>
									<input
										type='checkbox'
										checked={agreeTerms}
										onChange={e => setAgreeTerms(e.target.checked)}
										className='h-4 w-4 text-primary focus:ring-primary border-border rounded mt-1'
									/>
									<label className='ml-2 block text-sm text-muted-foreground'>
										Согласен с{' '}
										<button
											type='button'
											className='text-primary hover:text-primary/80 font-medium'
										>
											условиями
										</button>
									</label>
								</div>

								<button
									type='submit'
									disabled={!doPasswordsMatch || !agreeTerms}
									className='w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-300 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
								>
									Создать аккаунт
								</button>

								<div className='text-center'>
									<p className='text-sm text-muted-foreground'>
										Уже есть аккаунт?{' '}
										<Link
											to='/login'
											className='text-primary hover:text-primary/80 font-medium transition-colors underline'
										>
											Войти
										</Link>
									</p>
								</div>
							</form>
						</div>
					</div>
				</div>
			</section>

			<footer className='py-6 border-t border-border bg-card'>
				<div className='container mx-auto px-4 text-center text-sm text-muted-foreground'>
					© 2025 ConferHub. Платформа для онлайн-конференций.
				</div>
			</footer>
		</div>
	);
}
