import Router from '@koa/router'
import { Redirect, db } from "../lib/database.js"
import { hasCertificate } from "../api/dns.js"
import { render } from "../middlewares/render.js"
import { createCertificate, getCname } from './dns.js'

const isProd = process.env.NODE_ENV === 'production'
const DISABLE_OUR_REDIRECT = false
const router = new Router();
const SUB_DOMAIN_REGEX =
  /^(?:[\dA-Za-z](?:[\dA-Za-z-]{0,61}[\dA-Za-z])?\.)+[A-Za-z]{2,7}$/;


router.get('/', async (ctx,) => {
  const domain = ctx.query.domain
  const isDomainValid = typeof domain === 'string' && SUB_DOMAIN_REGEX.test(domain)
  if (!isDomainValid) {
    ctx.body = render('main', { domain, errors: { domain: 'Incorrect domain' } })
    return
  }

  const redirects = await db.all<Redirect[]>(
    `SELECT * FROM redirects 
      WHERE domain = $1 AND deletedAt IS NULL 
      ORDER BY createdAt`,
    [domain]
  )
  console.log('redirects found for ' + domain, redirects.map(r => r.pathname), hasCertificate(domain))
  ctx.body = render('main', { redirects, domain, isValid: hasCertificate(domain) })
})


router.post('/', async (ctx,) => {
  const { domain, pathname, destination } = (ctx.state.body)
  if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') { ctx.status = 401; return }
  await db.run(
    `INSERT INTO redirects (domain,  pathname, destination, deletedAt) 
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT(domain, pathname) DO UPDATE SET
        destination = $3,
        createdAt = datetime('now'),
        deletedAt = NULL;`,
    [domain, pathname, destination]
  )
  ctx.body = render('form2-list', { redirects: [{ domain, pathname, destination }] })
})

router.delete('/', async (ctx) => {
  const { domain, pathname } = ctx.request.query
  console.log({ domain, pathname }, ctx.url)
  if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') { ctx.status = 401; return }
  await db.all(
    `UPDATE redirects SET deletedAt = datetime('now') 
      WHERE domain = $1 AND pathname = $2;`,
    [domain, pathname]
  )
  ctx.status = 200
})

router.post('/dns', async ctx => {
  const domain = ctx.request.query.domain as string
  if (domain == null) {
    ctx.status = 400; return
  }
  const cnameDomaines = await getCname(domain)
  console.log('DNS for ', { domain, cnameDomaines })
  const isValid = cnameDomaines.includes('redirected.app')
  ctx.status = 204
  if (isValid && isProd && !hasCertificate(domain)) {
    await createCertificate(domain)
    ctx.status = 200
  }
})


export default router;