import http from 'node:http';
import https from 'node:https';
import koa from 'koa';
import cors from '@koa/cors';
import { bodyParser, errorHandler, initDb, limiter, } from './middlewares/helpers.js';
import { forwardLink } from './middlewares/forward-link.js';
import { logRequest } from './middlewares/log-request.js';
import api2Router from './api/index.js';
import { staticAssets } from './middlewares/static.js';

void initDb();
const app = new koa();

// Middlewares
app.use(logRequest);
app.use(errorHandler);
app.use(bodyParser);
if (process.env.NODE_ENV === 'production') {
	app.use(limiter);
}
if (process.env.NODE_ENV !== 'production') {
	app.use(staticAssets);
}

app.use(api2Router.routes()).use(api2Router.allowedMethods());

// Forward from custom URL to destination
app.use(forwardLink);

// HTTP server
const HTTP_PORT = 4012;
http
	.createServer(app.callback())
	.listen(HTTP_PORT, () => {
		console.log('Listening HTTP on ' + HTTP_PORT);
	});
