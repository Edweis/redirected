import koa from 'koa';
import cors from '@koa/cors'
import fs from 'fs';
import { health } from './api/health.js';
import { bodyParser,  errorHandler, initDb } from './middleware.js';
import { redirectGet, redirectPost } from './api/redirect.js';

await initDb()
const app = new koa();
app.use(errorHandler);
app.use(bodyParser);
app.use(cors());



// HTML
app.use(async (ctx, next) => {
  if (ctx.request.url !== '/') return next()
  ctx.type = 'html';
  ctx.body = fs.createReadStream('./src/index.html');
});

// Api
app.use(health)
app.use(redirectGet)
app.use(redirectPost)

app.listen(3000);