import type { JSX } from 'react';

export interface FeatureCardProps {
	icon: JSX.Element;
	title: string;
	description: string;
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
	return (
		<div className='text-center p-6 border border-border rounded-lg hover:border-primary transition-all duration-300 hover:transform hover:scale-105 bg-card shadow-sm'>
			<div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
				{icon}
			</div>
			<h3 className='text-xl font-semibold mb-2'>{title}</h3>
			<p className='text-muted-foreground'>{description}</p>
		</div>
	);
};
