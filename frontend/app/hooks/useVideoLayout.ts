import { useMemo } from 'react';

interface GridConfig {
	gridClass: string;
	itemClass: string;
}

export const useVideoLayout = (
	hasScreenShare: boolean,
	participants: any[]
) => {
	const totalUsers = participants.length;

	return useMemo(() => {
		let gridConfig: GridConfig;

		if (hasScreenShare) {
			gridConfig = {
				gridClass: 'grid-cols-1 md:grid-cols-2',
				itemClass: hasScreenShare ? 'md:row-span-2' : '',
			};
		} else {
			switch (totalUsers) {
				case 1:
					gridConfig = {
						gridClass: 'grid-cols-1',
						itemClass: 'h-full',
					};
					break;
				case 2:
					gridConfig = {
						gridClass: 'grid-cols-1 md:grid-cols-2',
						itemClass: '',
					};
					break;
				case 3:
					gridConfig = {
						gridClass: 'grid-cols-1 md:grid-cols-2',
						itemClass: 'md:col-span-1',
					};
					break;
				case 4:
					gridConfig = {
						gridClass: 'grid-cols-2',
						itemClass: '',
					};
					break;
				case 5:
				case 6:
					gridConfig = {
						gridClass: 'grid-cols-2 md:grid-cols-3',
						itemClass: '',
					};
					break;
				default:
					gridConfig = {
						gridClass: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
						itemClass: '',
					};
			}
		}

		return {
			totalUsers,
			gridConfig,
		};
	}, [hasScreenShare, totalUsers]);
};
