import koa from 'koa';
import cors from '@koa/cors'
import https from 'https';
import http from 'http';
import fs from 'fs';
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
const PORT = IS_PROD ? 80 : 3000
http.createServer(app.callback()).listen(PORT);
console.log('Listinging on port ' + PORT)
https.createServer({
  key: fs.readFileSync("/etc/letsencrypt/live/redirected.app/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/redirected.app/fullchain.pem")
}, app.callback()).listen(443);
