import fs from 'fs';
import devcert from 'devcert';
import koa from 'koa';
import cors from '@koa/cors'
import http from 'http';
import tls from 'tls';
import https from 'https';
import { health } from './api/health.js';
import { bodyParser, errorHandler, forceHttps, initDb } from './middlewares/helpers.js';
import { redirectGet, redirectPost } from './api/redirect.js';
import { rootWebsite, wellKnownForCerts } from './middlewares/static.js';

void initDb()
const app = new koa();
app.use(errorHandler);
app.use(bodyParser);
app.use(cors());
app.use(forceHttps);


// Static assets
app.use(rootWebsite);
app.use(wellKnownForCerts);

// Api
app.use(health)
app.use(redirectGet)
app.use(redirectPost)

const IS_PROD = process.env.NODE_ENV === 'production'

// HTTP server
const HTTP_PORT = IS_PROD ? 80 : 3000
http
  .createServer(app.callback())
  .listen(HTTP_PORT, () => 'Listening HTTP on ' + HTTP_PORT);


// HTTPS server
const HTTPS_PORT = IS_PROD ? 443 : 3001
const DEV_DOMAINS = !IS_PROD && await devcert.certificateFor(['localhost', 'redirected.test'])
const certDatabase = IS_PROD
  ? async (domain: string) => ({
    key: fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
    cert: fs.readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`)
  })
  : async () => DEV_DOMAINS // if this step is blocking, you probably need to type your password in the process to authorize the dev CA creation. @see https://github.com/davewasmer/devcert#how-it-works

const httpsOptions: https.ServerOptions = {
  SNICallback(domain, cb) {
    certDatabase(domain)
      .then(cert => tls.createSecureContext(cert))
      .then(ctx => cb(null, ctx))
      .catch(err => cb(err, null))
  },
}
https
  .createServer(httpsOptions, app.callback())
  .listen(HTTPS_PORT, () => 'Listening HTTP on ' + HTTPS_PORT);
