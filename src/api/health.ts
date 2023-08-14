import { Middleware } from "../lib/types.js"


export const health: Middleware = async (ctx, next) => {
  if (ctx.path !== '/health') return next();
  const lastUpdate = new Date(process.env.DEPLOYED_AT).getTime()
  const updatedDiff = (new Date().getTime() - lastUpdate)/1000
  ctx.body = `🚀 All good bro. My last build is ${updatedDiff.toFixed(1)}s old 🚀`
}