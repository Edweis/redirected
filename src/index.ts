import http from 'node:http';
import https from 'node:https';
import koa from 'koa';
import cors from '@koa/cors';
import { bodyParser, errorHandler, firewall, forceHttps, initDb, limiter, log } from './middlewares/helpers.js';
import { staticAssets, wellKnownForCerts } from './middlewares/static.js';
import { httpsOptions } from './middlewares/https-options.js';
import { forwardLink } from './middlewares/forward-link.js';
import { logRequest } from './middlewares/log-request.js';
import api2Router from './api/index.js';

void initDb();
const app = new koa();

// Middlewares
app.use(firewall);
app.use(logRequest);
app.use(errorHandler);
app.use(log);
app.use(bodyParser);
app.use(cors());
if (process.env.NODE_ENV === 'production') {
	app.use(limiter);
}

app.use(forceHttps);

// Static assets
app.use(api2Router.routes()).use(api2Router.allowedMethods());
app.use(wellKnownForCerts);
app.use(staticAssets);

// Forward from custom URL to destination
app.use(forwardLink);

// HTTP server
const HTTP_PORT = process.env.NODE_ENV === 'production' ? 80 : 3000;
http
	.createServer(app.callback())
	.listen(HTTP_PORT, () => {
		console.log('Listening HTTP on ' + HTTP_PORT);
	});

// HTTPS server
const HTTPS_PORT = process.env.NODE_ENV === 'production' ? 443 : 3001;
https
	.createServer(httpsOptions, app.callback())
	.listen(HTTPS_PORT, () => {
		console.log('Listening HTTP on ' + HTTPS_PORT);
	});
