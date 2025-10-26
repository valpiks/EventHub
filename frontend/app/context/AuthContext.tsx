import { createContext, useContext, useEffect, useState } from 'react';
import { accLogout, getUserData, login, refreshTokens } from '~/api/auth';

export interface AuthContextType {
	isUserAuthorized: boolean;
	user: any;
	singIn: (data: any) => Promise<boolean>;
	logout: () => Promise<void>;
	setUser: () => void;
	setIsUserAuthorized: () => void;
	logout: () => void;
}

interface AuthProviderProps {
	children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [isUserAuthorized, setIsUserAuthorized] = useState(false);
	const [user, setUser] = useState(null);

	const singIn = async (data: any) => {
		try {
			const response = await login(data);
			if (response?.data?.token) {
				localStorage.setItem('token', response.data.token);
				setUser(response.data.user);
				setIsUserAuthorized(true);
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	};

	const logout = async () => {
		try {
			await accLogout();
		} catch (error) {
			console.error('Logout error:', error);
		} finally {
			localStorage.removeItem('token');
			setUser(null);
			setIsUserAuthorized(false);
		}
	};

	const refresh = async () => {
		try {
			const response = await getUserData();
			if (response?.data) {
				setUser(response.data);
				setIsUserAuthorized(true);
			}
		} catch (error) {
			try {
				const refreshResponse = await refreshTokens();
				if (refreshResponse?.data?.token) {
					localStorage.setItem('token', refreshResponse.data.token);
					const userResponse = await getUserData();
					setUser(userResponse.data);
					setIsUserAuthorized(true);
				} else {
					await logout();
				}
			} catch (refreshError) {
				await logout();
			}
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				isUserAuthorized,
				user,
				singIn,
				logout,
				setUser,
				setIsUserAuthorized,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within a AuthProvider');
	}
	return context;
};
