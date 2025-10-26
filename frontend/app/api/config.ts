import axios from 'axios';
import { refreshTokens } from './auth';

export const apiClient = axios.create({
	// baseURL: env.base_url
	headers: {
		'Content-Type': 'application/json',
	},
	withCredentials: true,
});

apiClient.interceptors.request.use(
	config => {
		const token = localStorage.getItem('token');

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	error => {
		return Promise.reject(error);
	}
);

apiClient.interceptors.response.use(
	response => {
		return response;
	},
	async error => {
		const originalRequest = error.config;

		if (error.response?.status === 403 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const response = await refreshTokens();
				if (response?.data?.accessToken) {
					const newToken = response.data.accessToken;
					localStorage.setItem('token', newToken);

					originalRequest.headers.Authorization = `Bearer ${newToken}`;
					return apiClient(originalRequest);
				} else {
					throw new Error('No access token in refresh response');
				}
			} catch (refreshError) {
				// localStorage.removeItem('token');
				// window.location.href = '/login';
			}
		}

		return Promise.reject(error);
	}
);
