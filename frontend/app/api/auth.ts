import { apiClient } from './config';

export const login = async data => {
	const response = await apiClient.post('/auth/login', data);
	return response.data;
};

export const accLogout = async () => {
	const response = await apiClient.post('/auth/logout');
	return response.data;
};

export const register = async data => {
	const response = await apiClient.post('/auth/register', data);
	return response.data;
};

export const getUserData = async () => {
	const response = await apiClient.get('/user/me');
	return response.data;
};

export const getUserProfile = async () => {
	const response = await apiClient.get('/user/profile');
	return response.data;
};

export const refreshTokens = async () => {
	const response = await apiClient.post('/auth/refresh');
	return response.data;
};
