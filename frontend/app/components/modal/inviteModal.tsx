import { IconCheck, IconCopy, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { Button } from '../UI/button';

export const InviteModal = ({
	isOpen,
	onClose,
	inviteLink,
}: {
	isOpen: boolean;
	onClose: () => void;
	inviteLink?: string;
}) => {
	const currentDomain = window.location.origin;
	const [copied, setCopied] = useState(false);
	const fullLink = currentDomain + '/join-link?token=' + inviteLink;

	const copyToClipboard = async () => {
		if (!inviteLink) return;
		try {
			await navigator.clipboard.writeText(fullLink);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			console.error('Failed to copy: ', err);
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className='fixed inset-0 bg-black/20 flex items-center justify-center z-50'
			onClick={onClose}
		>
			<div
				className='bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border'
				onClick={e => e.stopPropagation()}
			>
				<div className='flex items-center justify-between'>
					<h3 className='font-semibold text-lg'>Пригласить в комнату</h3>
					<Button variant='ghost' size='icon' onClick={onClose}>
						<IconX className='h-5 w-5' />
					</Button>
				</div>

				<div className='space-y-4'>
					<p className='text-sm text-muted-foreground'>
						Отправьте эту ссылку для приглашения в комнату
					</p>

					<div className='flex gap-2'>
						<div className='flex-1 bg-muted rounded-lg px-3 py-2 border border-border'>
							<p className='text-sm truncate'>
								{inviteLink ? fullLink : 'Ссылка не доступна'}
							</p>
						</div>
						<Button
							onClick={copyToClipboard}
							disabled={!inviteLink}
							className='shrink-0'
						>
							{copied ? (
								<IconCheck className='h-4 w-4' />
							) : (
								<IconCopy className='h-4 w-4' />
							)}
						</Button>
					</div>

					{copied && <p className='text-sm text-green-600'>Скопировано!</p>}
				</div>
			</div>
		</div>
	);
};
