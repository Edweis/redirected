import { Middleware } from "../lib/types.js";
import { db } from "../lib/database.js";

export const logRequest: Middleware = async (ctx, next) => {
  await next()
  if (ctx.method === 'OPTIONS') return
  const isStaticAsset = /\.\w{2,}$/.test(ctx.url)
  if(ctx.hostname === 'redirected.app' || ctx.hostname ==='localhost'){
    if (ctx.method !== 'GET' || isStaticAsset) return
  }

  console.log('Logging: ', [
    ctx.hostname,
    ctx.url,
    new Date().toISOString(),
    ctx.ip.replace('::ffff:', ''),
    ctx.method,
    ctx.req.headers.referer,
    ctx.req.headers["user-agent"],
    ctx.status,
    ctx.response.headers['location']
  ])
  void db.run(
    `INSERT INTO travels ( domain, pathname, createdAt, ip, method, referrer, userAgent, status, redirectedTo ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      ctx.hostname,
      ctx.url,
      new Date().toISOString(),
      ctx.ip.replace('::ffff:', ''),
      ctx.method,
      ctx.req.headers.referer,
      ctx.req.headers["user-agent"],
      ctx.status,
      ctx.response.headers['location']
    ]
  )
}