import {
	IconArrowLeft,
	IconBrandTelegram,
	IconEye,
	IconEyeOff,
	IconLock,
	IconMail,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ThemeToggle } from '~/components/UI/themeToggle';
import { useAuth } from '~/context/AuthContext';

export default function LoginPage() {
	const navigator = useNavigate();
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [showPassword, setShowPassword] = useState<boolean>(false);

	const { singIn, isUserAuthorized } = useAuth();

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault();
		const response = singIn({ email, password });
		if (response) {
			navigator('/join');
		}
	};

	const togglePasswordVisibility = (): void => {
		setShowPassword(!showPassword);
	};

	return (
		<div className='min-h-screen bg-gradient-hero'>
			{/* Header */}
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

			{/* Login Section */}
			<section className='min-h-screen flex items-center justify-center pt-20'>
				<div className='container mx-auto px-4'>
					<div className='max-w-md mx-auto'>
						<div className='bg-card border border-border rounded-2xl shadow-card p-8'>
							<div className='text-center mb-8'>
								<h1 className='text-3xl font-bold mb-2'>Добро пожаловать</h1>
								<p className='text-muted-foreground'>Войдите в свой аккаунт</p>
							</div>

							<form onSubmit={handleSubmit} className='space-y-6'>
								<div>
									<label
										htmlFor='email'
										className='block text-sm font-medium mb-2'
									>
										Email
									</label>
									<div className='relative'>
										<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
											<IconMail className='h-5 w-5 text-muted-foreground' />
										</div>
										<input
											id='email'
											name='email'
											type='email'
											autoComplete='email'
											required
											value={email}
											onChange={e => setEmail(e.target.value)}
											className='block w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300'
											placeholder='your@email.com'
										/>
									</div>
								</div>

								<div>
									<label
										htmlFor='password'
										className='block text-sm font-medium mb-2'
									>
										Пароль
									</label>
									<div className='relative'>
										<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
											<IconLock className='h-5 w-5 text-muted-foreground' />
										</div>
										<input
											id='password'
											name='password'
											type={showPassword ? 'text' : 'password'}
											autoComplete='current-password'
											required
											value={password}
											onChange={e => setPassword(e.target.value)}
											className='block w-full pl-10 pr-12 py-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300'
											placeholder='Введите ваш пароль'
										/>
										<button
											type='button'
											className='absolute inset-y-0 right-0 pr-3 flex items-center'
											onClick={togglePasswordVisibility}
										>
											{showPassword ? (
												<IconEyeOff className='h-5 w-5 text-muted-foreground hover:text-primary transition-colors' />
											) : (
												<IconEye className='h-5 w-5 text-muted-foreground hover:text-primary transition-colors' />
											)}
										</button>
									</div>
								</div>

								<div className='text-right'>
									<button
										type='button'
										className='text-sm text-primary hover:text-primary/80 transition-colors font-medium'
									>
										Забыли пароль?
									</button>
								</div>

								<button
									type='submit'
									className='w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 font-medium shadow-md hover:shadow-lg'
								>
									Войти
								</button>

								<div className='text-center'>
									<p className='text-sm text-muted-foreground'>
										Нет аккаунта?{' '}
										<Link
											type='button'
											to='/register'
											className='text-primary hover:text-primary/80 font-medium transition-colors underline'
										>
											Зарегистрироваться
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
