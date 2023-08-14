import koa from 'koa';
import cors from '@koa/cors'
import fs from 'fs';
import http from 'http';
import https from 'https';
import { health } from './api/health.js';
import { bodyParser, errorHandler, initDb } from './middleware.js';
import { redirectGet, redirectPost } from './api/redirect.js';

void initDb()
const app = new koa();
app.use(errorHandler);
app.use(bodyParser);
app.use(cors());
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// HTML
app.use(async (ctx, next) => {
  if (ctx.path !== '/') return next()
  ctx.type = 'html';
  ctx.body = fs.createReadStream('./src/index.html');
});

// Certificates
app.use(async (ctx, next) => {
  const file = /^\/\.well-known\/(\w+)$/.exec(ctx.path)?.[1]
  if (file == null) return next()
  
  const wellKnownPath = path.join(__dirname, '../src/.well-known/'+file)
  const exists = fs.existsSync(wellKnownPath)
  if (exists) {
    ctx.type = 'html';
    ctx.body = fs.createReadStream(wellKnownPath);
  }
});

// Api
app.use(health)
app.use(redirectGet)
app.use(redirectPost)

const IS_PROD = process.env.NODE_ENV === 'production'
const PORT = IS_PROD ? 80 : 3000
http.createServer(app.callback()).listen(PORT);
console.log('Listinging on port ' + PORT)
// https.createServer({
//   key: fs.readFileSync("./certs/dev-privatekey.pem"),
//   cert: fs.readFileSync("./certs/dev-certificate.pem")
// }, app.callback()).listen(443);