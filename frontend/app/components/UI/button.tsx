import * as React from 'react';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link';
	size?: 'default' | 'small' | 'large' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{ className = '', variant = 'default', size = 'default', ...props },
		ref
	) => {
		const baseStyles =
			'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

		const variantStyles = {
			default:
				'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
			destructive:
				'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
			outline:
				'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
			secondary:
				'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
			ghost: 'hover:bg-accent hover:text-accent-foreground',
			link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
		};

		const sizeStyles = {
			default: 'h-10 px-4 py-2',
			small: 'h-9 px-3 text-sm',
			large: 'h-11 px-8 text-base',
			icon: 'h-10 w-10',
		};

		const buttonClass = [
			baseStyles,
			variantStyles[variant],
			sizeStyles[size],
			className,
		]
			.filter(Boolean)
			.join(' ');

		return <button className={buttonClass} ref={ref} {...props} />;
	}
);

Button.displayName = 'Button';

export { Button };
