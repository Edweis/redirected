import { Middleware } from "../lib/types.js"


export const health: Middleware = async (ctx, next) => {
  if (ctx.path !== '/health') return next();
  ctx.body = '🚀 All good bro 🚀'
}