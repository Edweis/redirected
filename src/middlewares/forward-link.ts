import { db } from '../lib/database.js';
import { Middleware } from './types.js';

export const forwardLink: Middleware = async (ctx, next) => {
	const domain = ctx.request.hostname;
	if (domain === 'localhost') {
		return next();
	}

	const pathname = ctx.url.replace(/^\//, '');
	const response = await db.get<{ destination: string }>(
		'SELECT destination FROM redirects WHERE domain = $1 AND pathname = $2 AND deletedAt IS NULL',
		[domain, pathname],
	);
	console.log('🏃 Forwarding', { domain, pathname }, response?.destination);
	if (response == null) {
		ctx.redirect('https://redirected.app'); return;
	}

	console.log('Redirecting from ' + domain + '/' + pathname + ' to ' + response.destination);
	ctx.redirect(response.destination);
};
