import * as yup from 'yup'
import Router from '@koa/router'
import { Middleware } from "koa"
import { Redirect, RedirectNew, db } from "../lib/database.js"
import { hasCertificate } from "../api/dns.js"
import { render } from "../middlewares/render.js"

const DISABLE_OUR_REDIRECT = false
const router = new Router();
const SUB_DOMAIN_REGEX =
  /^(?:[\dA-Za-z](?:[\dA-Za-z-]{0,61}[\dA-Za-z])?\.)+[A-Za-z]{2,7}$/;

router.get('/', async (ctx, next) => {
  const domain = ctx.query.domain
  console.log({ domain })
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


const schemaRedirectPut: yup.ObjectSchema<RedirectNew> = yup.object({
  domain: yup.string().required(),
  pathname: yup.string().matches(/^\w/).required(),
  destination: yup.string().transform(u => 'https://' + u).url().required()
}).required()

router.post('/', async (ctx, next) => {
  const { domain, pathname, destination } = schemaRedirectPut.validateSync(ctx.state.body)
  if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') { ctx.status = 401; return }
  console.log('Adding ', { domain, pathname, destination })
  await db.run(
    `INSERT INTO redirects (domain,  pathname, destination, deletedAt) 
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT(domain, pathname) DO UPDATE SET
        destination = $3,
        createdAt = datetime('now'),
        deletedAt = NULL
        ;`,
    [domain, pathname, destination]
  )
  return ctx.redirect('/')
})

export default router;