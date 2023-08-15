import { ValidationError } from "yup";
import { db } from "../lib/database.js";
import { Middleware } from "../lib/types.js";
import parse from 'co-body'

export const initDb = async () => {
  await db.exec(`CREATE TABLE IF NOT EXISTS redirects (
                  domain TEXT NOT NULL, 
                  pathname TEXT NOT NULL, 
                  destination TEXT NOT NULL, 
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                  deletedAt TIMESTAMP,
                  PRIMARY KEY (domain, pathname)
                );`)
  const { count } = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM redirects');
  console.log('Redirect count: ' + count)
}

export const errorHandler: Middleware = async (ctx, next) => {
  try { return await next() }
  catch (e) {
    if (e instanceof ValidationError) {
      ctx.body = e.message;
      ctx.status = 400
    } else {
      ctx.body = 'Internal Server Error: ' + e.message,
        ctx.status = 500
      console.error(e)
    }
  }
}

export const bodyParser: Middleware = async (ctx, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
    const body = await parse(ctx.req);
    ctx.state = { body };
  }
  return next()
}

export const forceHttps: Middleware = async (ctx, next) => {
  if (ctx.path.startsWith('/.weel-known/')) return next();
  if (ctx.protocol === 'https') return next()
  const nextUrl = new URL(ctx.URL);
  nextUrl.protocol = 'https'
  console.log('Redireting to ', nextUrl.toString())
  return ctx.redirect(nextUrl.toString())
}