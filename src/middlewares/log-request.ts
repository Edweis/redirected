import { Middleware } from "../lib/types.js";
import { db } from "../lib/database.js";
import { UAParser } from 'ua-parser-js'
export const logRequest: Middleware = async (ctx, next) => {
  await next()
  if (ctx.method === 'OPTIONS') return
  const isStaticAsset = /\.\w{2,}$/.test(ctx.originalUrl)
  console.log({ isStaticAsset }, ctx.hostname, ctx.method)
  if (ctx.hostname === 'redirected.app' || ctx.hostname === 'localhost') {
    if (ctx.method !== 'GET' || isStaticAsset) return
  }
  console.log('saving ...')

  const ua = new UAParser(ctx.req.headers['user-agent'])
  void db.run(
    `INSERT INTO travels ( domain, pathname, createdAt, ip, method, referrer, userAgent, userAgentBrowser, userAgentOs, userAgentDevice, status, redirectedTo ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      ctx.hostname,
      ctx.url,
      new Date().toISOString(),
      ctx.ip.replace('::ffff:', ''),
      ctx.method,
      ctx.req.headers.referer,
      ua.getUA(),
      [ua.getBrowser().name, ua.getBrowser().version].map(v => v || '?').join('/'),
      [ua.getOS().name, ua.getOS().version].map(v => v || '?').join('/'),
      [ua.getDevice().vendor, ua.getDevice().model, ua.getDevice().type].map(v => v || '?').join('/'),
      ctx.status,
      ctx.response.headers['location']
    ]
  )
}