import koa from 'koa';
import cors from '@koa/cors'
import http from 'http';
import https from 'https';
import { health } from './api/health.js';
import { bodyParser, errorHandler, forceHttps, initDb } from './middlewares/helpers.js';
import { redirectGet, redirectPost } from './api/redirect.js';
import { rootWebsite, wellKnownForCerts } from './middlewares/static.js';
import { httpsOptions } from './middlewares/https-options.js';
import { dnsCheckPost } from './api/dns.js';

void initDb()
const app = new koa();
app.use(errorHandler);
app.use(bodyParser);
app.use(cors());
// app.use(forceHttps);


// Static assets
app.use(rootWebsite);
app.use(wellKnownForCerts);

// Api
app.use(health)
app.use(redirectGet)
app.use(redirectPost)
app.use(dnsCheckPost)

const IS_PROD = process.env.NODE_ENV === 'production'

// HTTP server
const HTTP_PORT = IS_PROD ? 80 : 3000
http
  .createServer(app.callback())
  .listen(HTTP_PORT, () => 'Listening HTTP on ' + HTTP_PORT);


// HTTPS server
const HTTPS_PORT = IS_PROD ? 443 : 3001
https
  .createServer(httpsOptions, app.callback())
  .listen(HTTPS_PORT, () => 'Listening HTTP on ' + HTTPS_PORT);
