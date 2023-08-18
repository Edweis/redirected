import { Middleware } from "koa";
import { db } from "../lib/database.js";

export const forwardLink: Middleware = async (ctx, next) => {
  const domain = ctx.request.host;
  const pathname = ctx.url.replace(/^\//, '');
  console.log({domain, pathname})
  const response = await db.get<{ destination: string }>(
    'SELECT destination FROM redirects WHERE domain = $1 AND pathname = $2',
    [domain, pathname]
  )
  if (response == null) return next();
  console.log('Redirecting from ' + domain + '/' + pathname + ' to ' + response.destination);
  ctx.redirect(response.destination)
}