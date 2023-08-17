import { Middleware } from "koa";
import { db } from "../lib/database.js";

export const forwardLink: Middleware = async (ctx, next) => {
  console.log(ctx.originalUrl, ctx.request.host, ctx.request.host);
  const response = await db.get<{destination:string}>(
    'SELECT destination FROM redirects WHERE domain = $1 AND pathname = $2', 
    [ctx.request.host, ctx.url]
  )
  if(response==null) return next();
  ctx.redirect(response.destination)
}