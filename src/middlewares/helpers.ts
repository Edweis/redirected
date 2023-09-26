import { exec } from 'node:child_process';
import parse from 'co-body';
import { RateLimit } from 'koa2-ratelimit';
import { db } from '../lib/database.js';
import { type Middleware } from '../lib/types.js';

export const initDb = async () => {
	await db.exec(`CREATE TABLE IF NOT EXISTS redirects (
                  domain TEXT NOT NULL, 
                  pathname TEXT NOT NULL, 
                  destination TEXT NOT NULL, 
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                  deletedAt TIMESTAMP,
                  PRIMARY KEY (domain, pathname)
                );`);
	await db.exec(`CREATE TABLE IF NOT EXISTS travels (
                  domain TEXT NOT NULL, 
                  pathname TEXT NOT NULL, 
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

                  ip TEXT NOT NULL,
                  method TEXT NOT NULL,
                  referrer TEXT,
                  userAgent Text NOT NULL,
                  userAgentBrowser Text,
                  userAgentOs Text,
                  userAgentDevice Text,

                  status TEXT NOT NULL,
                  redirectedTo TEXT,
                  PRIMARY KEY (domain, pathname, createdAt)
                );`);
	const count = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM redirects');
	console.log('Redirect count: ' + count?.count);
};

export const errorHandler: Middleware = async (ctx, next) => {
	try {
		return await next();
	} catch (error) {
		ctx.body = 'Internal Server Error: ' + (error as Error).message,
			ctx.status = 500;
		console.error(error);
	}
};

export const bodyParser: Middleware = async (ctx, next) => {
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
		const body = await parse(ctx.req).catch(() => '{}');
		ctx.state = { ...ctx.state, body };
	}

	return next();
};

export const forceHttps: Middleware = async (ctx, next) => {
	if (ctx.path.startsWith('/.well-known/')) {
		return next();
	}

	if (ctx.protocol === 'https') {
		return next();
	}

	if (ctx.hostname === 'localhost') {
		return next();
	}

	const nextUrl = new URL(ctx.URL);
	nextUrl.protocol = 'https';
	console.log('Redireting to', nextUrl.toString());
	ctx.redirect(nextUrl.toString());
};

export const log: Middleware = async (ctx, next) => {
	console.log(`> ${ctx.method} ${ctx.path}`);
	await next();
	console.log(`< ${ctx.status || 404} ${ctx.method} ${ctx.path}`);
};

export const limiter = RateLimit.middleware({
	interval: { min: 1 },
	max: 60,
});

export const execPromise = async (command: string) => new Promise<string>((res, rej) => {
	console.log('Running command:\n', command);
	exec(command, (error, stdout, sterr) => {
		if (sterr) {
			console.warn(sterr);
		}

		if (stdout) {
			console.warn(stdout);
		}

		error ? rej(error) : res(stdout);
	});
},
);

export const firewall: Middleware = async (ctx, next) => {
	if (ctx.path.includes('..')) {
		ctx.status = 400;
	} else {
		return next();
	}
};

