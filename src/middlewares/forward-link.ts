import { db } from '../lib/database.js';
import { Middleware } from './types.js';

export const forwardLink: Middleware = async (ctx, next) => {
	const domain = ctx.request.hostname;
	const pathname = ctx.request.URL.pathname.slice(1);
	if (domain === 'localhost') return next();


	const response = await db.get<{ destination: string }>(
		'SELECT destination FROM redirects WHERE domain = $1 AND pathname = $2 AND deletedAt IS NULL LIMIT 1',
		[domain, pathname],
	);
	if (response == null) {
		ctx.redirect('https://redirected.app?domain=' + domain); return;
	}

	console.log('Redirecting from ' + domain + '/' + pathname + ' to ' + response.destination);
	ctx.redirect('https://' + response.destination);
};
