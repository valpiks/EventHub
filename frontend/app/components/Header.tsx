import { IconBrandTelegram, IconUser, IconVideo } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useAuth } from '~/context/AuthContext';
import { Button } from './UI/button';
import { ThemeToggle } from './UI/themeToggle';

export const Header = () => {
	const { isUserAuthorized, logout } = useAuth();

	return (
		<header className='fixed top-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md z-50 border-b border-border'>
			<div className='container mx-auto flex justify-between items-center'>
				<Link
					to='/'
					className='flex cursor-pointer items-center gap-2 text-xl font-bold'
				>
					<div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground'>
						<IconBrandTelegram className='w-5 h-5' />
					</div>
					EventHub
				</Link>

				<div className='flex gap-2 items-center'>
					<ThemeToggle />
					<Link
						to='/rooms'
						className='px-2 py-2 rounded-md text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium'
					>
						<IconVideo />
					</Link>
					{isUserAuthorized ? (
						<div className='flex gap-4 items-center'>
							<Link
								to='/profile'
								className='px-2 py-2 rounded-md text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium'
							>
								<IconUser />
							</Link>

							<Button onClick={logout} variant='default'>
								Выйти
							</Button>
						</div>
					) : (
						<div className='flex gap-4 items-center'>
							<Link
								to='/login'
								className='px-4 py-2 rounded-md text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium'
							>
								Войти
							</Link>

							<Link
								to='/join'
								className='bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-all duration-300 font-medium shadow-md hover:shadow-lg'
							>
								Начать
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};
