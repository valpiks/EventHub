import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

export interface ButtonHandlers {
	handleStartNow: () => void;
	handleJoinMeeting: () => void;
	handleCreateMeeting: () => void;
	handleRegister: () => void;
	handleLogin: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const [theme, setTheme] = useState<Theme>('light');

	useEffect(() => {
		const savedTheme = localStorage.getItem('theme') as Theme;
		const systemPrefersDark = window.matchMedia(
			'(prefers-color-scheme: dark)'
		).matches;

		if (savedTheme) {
			setTheme(savedTheme);
		} else if (systemPrefersDark) {
			setTheme('dark');
		}
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
		localStorage.setItem('theme', theme);
	}, [theme]);

	const toggleTheme = (): void => {
		setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = (): ThemeContextType => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
};
