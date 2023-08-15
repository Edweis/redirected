import koa from 'koa';
import cors from '@koa/cors'
import https from 'https';
import http from 'http';
import fs from 'fs';
import devcert from 'devcert'
import { health } from './api/health.js';
import { bodyParser, errorHandler, initDb } from './middleware.js';
import { redirectGet, redirectPost } from './api/redirect.js';
import { rootWebsite, wellKnownForCerts } from './static.js';

void initDb()
const app = new koa();
app.use(errorHandler);
app.use(bodyParser);
app.use(cors());


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
http.createServer(app.callback()).listen(HTTP_PORT);
console.log('Listening HTTP on ' + HTTP_PORT)

// HTTPS server
const HTTPS_PORT = IS_PROD ? 443 : 3001
const options = IS_PROD
  ? {
    key: fs.readFileSync("/etc/letsencrypt/live/redirected.app/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/redirected.app/fullchain.pem")
  }
  : await devcert.certificateFor('localhost') // if this step is blocking, you probably need to type your password in the process to authorize the dev CA creation. @see https://github.com/davewasmer/devcert#how-it-works
https.createServer(options, app.callback()).listen(HTTPS_PORT);
console.log('Listening HTTPS on ' + HTTPS_PORT)