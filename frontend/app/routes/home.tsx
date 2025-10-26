import {
	IconBolt,
	IconInfinity,
	IconLink,
	IconMessageCircle,
	IconSettings,
	IconShieldLock,
	IconUsers,
	IconVideo,
} from '@tabler/icons-react';
import type { JSX } from 'react';
import { Link } from 'react-router';
import { FeatureCard } from '~/components/FeatureCard';
import { Header } from '~/components/Header';

export interface Feature {
	icon: JSX.Element;
	title: string;
	description: string;
}

const features: Feature[] = [
	{
		icon: <IconBolt className={`w-6 h-6 text-[#ff6b00] dark:text-[#ff9b40]`} />,
		title: 'Мгновенное подключение',
		description:
			'Создавайте комнаты и делитесь ссылками за секунды. Гостевой доступ без регистрации.',
	},
	{
		icon: (
			<IconUsers className={`w-6 h-6 text-[#ff6b00] dark:text-[#ff9b40]`} />
		),
		title: 'Управление участниками',
		description: 'Контроль ролей и статусов участников в реальном времени.',
	},
	{
		icon: <IconLink className={`w-6 h-6 text-[#ff6b00] dark:text-[#ff9b40]`} />,
		title: 'WebRTC технология',
		description: 'Стабильная передача аудио и видео с минимальной задержкой.',
	},
	{
		icon: (
			<IconShieldLock
				className={`w-6 h-6 text-[#ff6b00] dark:text-[#ff9b40]`}
			/>
		),
		title: 'Безопасность данных',
		description: 'Шифрование соединений и защита конфиденциальности.',
	},
	{
		icon: (
			<IconMessageCircle
				className={`w-6 h-6 text-[#ff6b00] dark:text-[#ff9b40]`}
			/>
		),
		title: 'История чата',
		description: 'Все сообщения сохраняются для вашего удобства.',
	},
	{
		icon: (
			<IconSettings className={`w-6 h-6 text-[#ff6b00] dark:text-[#ff9b40]`} />
		),
		title: 'Администрирование',
		description: 'Запись встреч, управление микрофонами и камерами.',
	},
];

export default function HomePage() {
	return (
		<div className='min-h-screen'>
			{/* Header */}
			<Header />

			{/* Hero Section */}
			<section className='min-h-screen flex items-center justify-center bg-gradient-hero pt-20'>
				<div className='container mx-auto px-4 text-center'>
					<h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6'>
						Конференции нового{' '}
						<span className='text-gradient bg-gradient-to-r from-[#ff6b00] to-[#e65c00] bg-clip-text text-transparent'>
							поколения
						</span>
					</h1>
					<p className='text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8'>
						Профессиональная платформа для видеосвязи и совместной работы
					</p>
					<div className='flex flex-wrap gap-4 justify-center'>
						<Link
							to='/login'
							className='bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-all duration-300 font-medium transform hover:scale-105 shadow-md hover:shadow-lg'
						>
							Начать сейчас
						</Link>
						<Link
							to='/join'
							className='border border-primary text-primary px-6 py-3 rounded-md hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium transform hover:scale-105'
						>
							Присоединиться
						</Link>
					</div>

					{/* Features Grid */}
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto'>
						<FeatureCard
							icon={
								<IconVideo
									className={`w-8 h-8 text-[#ff6b00] dark:text-[#ff9b40]`}
								/>
							}
							title='HD Видео'
							description='Качество до 1080p'
						/>
						<FeatureCard
							icon={
								<IconInfinity
									className={`w-8 h-8 text-[#ff6b00] dark:text-[#ff9b40]`}
								/>
							}
							title='Безлимит'
							description='Любое число участников'
						/>
						<FeatureCard
							icon={
								<IconMessageCircle
									className={`w-8 h-8 text-[#ff6b00] dark:text-[#ff9b40]`}
								/>
							}
							title='Чат'
							description='Обмен сообщениями в реальном времени'
						/>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='py-20 bg-muted'>
				<div className='container mx-auto px-4'>
					<div className='text-center mb-16'>
						<h2 className='text-3xl md:text-4xl font-bold mb-4'>
							Всё необходимое для эффективной работы
						</h2>
						<p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
							Мощный функционал для комфортного проведения онлайн-встреч
						</p>
					</div>

					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto'>
						{features.map((feature, index) => (
							<div
								key={index}
								className='bg-card p-6 rounded-lg border border-border hover:border-primary transition-all duration-300 transform hover:-translate-y-1 cursor-pointer shadow-card hover:shadow-glow'
							>
								<div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4'>
									{feature.icon}
								</div>
								<h3 className='text-xl font-semibold mb-3'>{feature.title}</h3>
								<p className='text-muted-foreground'>{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-20 bg-secondary'>
				<div className='container mx-auto px-4 text-center'>
					<h2 className='text-3xl md:text-4xl font-bold mb-4'>
						Готовы начать?
					</h2>
					<p className='text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8'>
						Присоединяйтесь к тысячам команд, которые уже используют ConferHub
					</p>
					<div className='flex flex-wrap gap-4 justify-center'>
						<Link
							to='/new-conf'
							className='bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-all duration-300 font-medium transform hover:scale-105 shadow-md hover:shadow-lg'
						>
							Создать встречу
						</Link>
						<Link
							to='/register'
							className='border border-primary text-primary px-6 py-3 rounded-md hover:bg-primary hover:text-primary-foreground transition-all duration-300 font-medium transform hover:scale-105'
						>
							Зарегистрироваться
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className='py-6 border-t border-border'>
				<div className='container mx-auto px-4 text-center text-sm text-muted-foreground'>
					© 2025 ConferHub. Платформа для онлайн-конференций.
				</div>
			</footer>
		</div>
	);
}
