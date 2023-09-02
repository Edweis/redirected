import Router from '@koa/router'
import { Middleware } from "koa"
import { Redirect, db } from "../lib/database.js"
import { hasCertificate } from "../api/dns.js"
import { render } from "../middlewares/render.js"

const router = new Router({ 'prefix': '/api2' });
const SUB_DOMAIN_REGEX =
  /^(?:[\dA-Za-z](?:[\dA-Za-z-]{0,61}[\dA-Za-z])?\.)+[A-Za-z]{2,7}$/;

router.get('/redirects', async (ctx, next) => {
  const domain = ctx.query.domain
  if (typeof domain !== 'string') return next()
  if (!SUB_DOMAIN_REGEX.test(domain)) return next()

  const redirects = await db.all<Redirect[]>(
    `SELECT * FROM redirects 
      WHERE domain = $1 AND deletedAt IS NULL 
      ORDER BY createdAt`,
    [domain]
  )
  console.log('redirects found for ' + domain, redirects.map(r => r.pathname), hasCertificate(domain))
  ctx.body = render('form2-list', { redirects, isValid: hasCertificate(domain) })
  console.log(ctx.body)
})

export default router;