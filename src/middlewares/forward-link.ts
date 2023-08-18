import { Middleware } from "koa";
import { db } from "../lib/database.js";

export const forwardLink: Middleware = async (ctx, next) => {
  const domain = ctx.request.hostname
  if (domain === 'localhost') return next()

  const pathname = ctx.url.replace(/^\//, '');
  console.log('Forwarding ', { domain, pathname })
  const response = await db.get<{ destination: string }>(
    'SELECT destination FROM redirects WHERE domain = $1 AND pathname = $2',
    [domain, pathname]
  )
  await db.run(
    `INSERT INTO travels (domain, pathname, destination, ip) 
                  VALUES ($1, $2, $3, $4)`,
    [domain, pathname, response?.destination, ctx.ip]
  )
  if (response == null) return ctx.redirect('https://redirected.app')
  console.log('Redirecting from ' + domain + '/' + pathname + ' to ' + response.destination);
  ctx.redirect(response.destination)
}