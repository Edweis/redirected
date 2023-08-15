import * as yup from 'yup'
import { Middleware } from '../lib/types.js'
import { Redirect, RedirectNew, db } from '../lib/database.js'




const schemaRedirectPut: yup.ObjectSchema<RedirectNew> = yup.object({
  domain: yup.string().required(),
  pathname: yup.string().matches(/^\w/).required(),
  destination: yup.string().url().required()
}).required()
export const redirectPost: Middleware = async (ctx, next) => {
  if (ctx.path !== '/redirects' || ctx.method !== 'POST') return next()
  const { domain, pathname, destination } = schemaRedirectPut.validateSync(ctx.state.body)
  await db.run(
    `INSERT INTO redirects (domain,  pathname, destination, deletedAt) 
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT(domain, pathname) DO UPDATE SET
        destination = $3,
        createdAt = datetime('now');`,
    [domain, pathname, destination]
  )
  ctx.body = undefined
  ctx.status = 201
}

export const redirectGet: Middleware = async (ctx, next) => {
  const domain = /\/redirects\/([\w\.]+)/.exec(ctx.path)?.[1]
  console.log()
  if (domain == null || ctx.method !== 'GET') return next()

  const redirects = await db.all<Redirect[]>(
    `SELECT * FROM redirects WHERE domain = $1 AND deletedAt IS NULL`,
    [domain]
  )
  ctx.body = redirects
}
