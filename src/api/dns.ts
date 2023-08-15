import * as yup from 'yup'
import { Middleware } from '../lib/types.js'
import dns from 'dns'



const dnsCheckPostSchema = yup.object({ domain: yup.string().required() }).required()
export const dnsCheckPost: Middleware = async (ctx, next) => {
  if (ctx.path !== '/dns' || ctx.method !== 'POST') return next()
  const { domain } = dnsCheckPostSchema.validateSync(ctx.state.body)
  const addresses = await new Promise<string[]>((res) =>
    dns.resolveCname(domain, (err, addr) => err ? res([]) : res(addr))
  )
  if (addresses.includes('redirected.app'))
    ctx.status = 201
  else ctx.status = 401
}