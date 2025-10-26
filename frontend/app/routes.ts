import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('/login', 'routes/login.tsx'),
	route('/register', 'routes/register.tsx'),
	route('/room/:id', 'routes/room.tsx'),
	route('/rooms', 'routes/rooms.tsx'),
	route('/join', 'routes/join.tsx'),
	route('/join-link', 'routes/joinByLink.tsx'),
	route('/create-conf', 'routes/createConf.tsx'),
	route('/profile', 'routes/profile.tsx'),
	route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
