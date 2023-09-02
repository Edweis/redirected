import koa from 'koa';
import cors from '@koa/cors'
import http from 'http';
import https from 'https';
import { health } from './api/health.js';
import { bodyParser, errorHandler, firewall, forceHttps, initDb, limiter, log, } from './middlewares/helpers.js';
import { redirectDelete, redirectGet, redirectPost } from './api/redirect.js';
import { rootWebsite, staticAssets, wellKnownForCerts } from './middlewares/static.js';
import { httpsOptions } from './middlewares/https-options.js';
import { dnsCheckPost } from './api/dns.js';
import { forwardLink } from './middlewares/forward-link.js';
import { logRequest } from './middlewares/log-request.js';
import { stats } from './api/stats.js';
import api2Router from './api2/index.js';

void initDb()
const app = new koa();

// Middlewares
app.use(firewall)
app.use(logRequest)
app.use(errorHandler);
app.use(log);
app.use(bodyParser);
app.use(cors());
if (process.env.NODE_ENV === 'production') app.use(limiter);
app.use(forceHttps);


// Static assets
app.use(rootWebsite);
app.use(wellKnownForCerts);
app.use(staticAssets);


// Api
app.use(api2Router.routes()).use(api2Router.allowedMethods())

app.use(health)
app.use(redirectGet)
app.use(redirectPost)
app.use(redirectDelete)
app.use(dnsCheckPost)
app.use(stats)

// forward from custom URL to destination
app.use(forwardLink)

// HTTP server
const HTTP_PORT = process.env.NODE_ENV === 'production' ? 80 : 3000
http
  .createServer(app.callback())
  .listen(HTTP_PORT, () => 'Listening HTTP on ' + HTTP_PORT);


// HTTPS server
const HTTPS_PORT = process.env.NODE_ENV === 'production' ? 443 : 3001
https
  .createServer(httpsOptions, app.callback())
  .listen(HTTPS_PORT, () => 'Listening HTTP on ' + HTTPS_PORT);
