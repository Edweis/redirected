import { exec } from 'child_process'
import { ValidationError } from "yup";
import { db } from "../lib/database.js";
import { Middleware } from "../lib/types.js";
import parse from 'co-body'
import { RateLimit } from 'koa2-ratelimit';

export const initDb = async () => {
  await db.exec(`CREATE TABLE IF NOT EXISTS redirects (
                  domain TEXT NOT NULL, 
                  pathname TEXT NOT NULL, 
                  destination TEXT NOT NULL, 
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                  deletedAt TIMESTAMP,
                  PRIMARY KEY (domain, pathname)
                );`)
  await db.exec(`CREATE TABLE IF NOT EXISTS travels (
                  domain TEXT NOT NULL, 
                  pathname TEXT NOT NULL, 
                  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

                  ip TEXT NOT NULL,
                  method TEXT NOT NULL,
                  referrer TEXT,
                  userAgent Text NOT NULL,
                  userAgentBrowser Text,
                  userAgentOs Text,
                  userAgentDevice Text,

                  status TEXT NOT NULL,
                  redirectedTo TEXT,
                  PRIMARY KEY (domain, pathname, createdAt)
                );`)
  const count = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM redirects');
  console.log('Redirect count: ' + count?.count)
}

export const errorHandler: Middleware = async (ctx, next) => {
  try { return await next() }
  catch (e) {
    if (e instanceof ValidationError) {
      ctx.body = e.message;
      ctx.status = 400
    } else {
      ctx.body = 'Internal Server Error: ' + (e as Error).message,
        ctx.status = 500
      console.error(e)
    }
  }
}

export const bodyParser: Middleware = async (ctx, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
    const body = await parse(ctx.req).catch(() => '{}')
    ctx.state = { body: JSON.parse(body) };
  }
  return next()
}

export const forceHttps: Middleware = async (ctx, next) => {
  if (ctx.path.startsWith('/.well-known/')) return next();
  if (ctx.protocol === 'https') return next()
  if (ctx.hostname === 'localhost') return next()
  const nextUrl = new URL(ctx.URL);
  nextUrl.protocol = 'https'
  console.log('Redireting to ', nextUrl.toString())
  return ctx.redirect(nextUrl.toString())
}

export const log: Middleware = async (ctx, next) => {
  console.log(`> ${ctx.method} ${ctx.path}`)
  await next();
  console.log(`< ${ctx.status || 404} ${ctx.method} ${ctx.path}`)
}

export const limiter = RateLimit.middleware({
  interval: { min: 1 },
  max: 60, 
});


export const execPromise = (command: string) => new Promise<string>((res, rej) => {
  console.log('Running command:\n', command)
  exec(command, (err, stdout, sterr) => {
    if (sterr) console.warn(sterr)
    if (stdout) console.warn(stdout)
    return err ? rej(err) : res(stdout)
  })
}
)

export const firewall: Middleware = async (ctx, next) => {
  if (ctx.path.includes('..')) ctx.status = 400;
  else return next()
}