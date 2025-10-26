import { apiClient } from './config';

export const createRoom = async data => {
	const response = await apiClient.post('/rooms', data);
	return response.data;
};

export const getRoomData = async (roomUUID: string) => {
	const response = await apiClient.get(`/rooms/${roomUUID}`);
	return response.data;
};

export const getParticipants = async (roomUUID: string) => {
	const response = await apiClient.get(`/rooms/${roomUUID}/participants`);
	return response.data;
};

export const joinRoomByToken = async (token: string) => {
	const response = await apiClient.get(`/rooms/join/${token}`);
	return response.data;
};

export const joinByGuest = async data => {
	const response = await apiClient.post(`/guest/join`, {
		...data,
		roomInviteLink: data.roomInviteLink.split('token=')[1],
	});
	return response.data;
};

export const joinDirectByLink = async (inviteCode: string) => {
	const response = await apiClient.post(
		`/rooms/join/${inviteCode.split('token=')[1]}`
	);
	return response.data;
};

export const getUserRooms = async () => {
	const response = await apiClient.get('/rooms/my-rooms');
	return response.data;
};
