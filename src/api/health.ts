import { Middleware } from "../lib/types.js"

function formatSeconds(seconds) {
  const date = new Date(0);
  date.setSeconds(seconds);

  const days = date.getUTCDate() - 1;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const sec = date.getUTCSeconds();

  return `${days}d ${hours}h ${minutes}m ${sec}s`.replace(/0\w /g,'')
}

export const health: Middleware = async (ctx, next) => {
  if (ctx.path !== '/health') return next();
  const lastUpdate = new Date(process.env.DEPLOYED_AT).getTime()
  const diff = (new Date().getTime() - lastUpdate) / 1000
  ctx.body = `🚀 All good bro 🚀 \nMy last build is ${formatSeconds(diff)} old`
}