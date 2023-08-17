import * as yup from 'yup'
import { Middleware } from '../lib/types.js'
import dns from 'dns/promises'
import fs from 'fs'
import { exec } from 'child_process'
import { SUB_DOMAIN_REG, projectRoot } from '../lib/helpers.js'
import mem from 'mem';

const isProd = process.env.NODE_ENV==='production'
const certPath = `${projectRoot()}/../certs/live`
const execPromise = (command: string) => new Promise<string>((res, rej) => {
  console.log('Running command:\n', command)
  exec(command, (err, stdout, sterr) => {
    if (sterr) console.warn(sterr)
    if (stdout) console.warn(stdout)
    return err ? rej(err) : res(stdout)
  })
}
)
const getCname = mem(
  async (domain: string) =>  execPromise(`dig ${domain} cname +trace +short`),
  { maxAge: 1000 }
)
const hasCertificate = (domain: string) => fs.existsSync(`${certPath}/${domain}/fullchain.pem`)
const createCertificate = async (domain: string) => execPromise(`
  certbot certonly --webroot --agree-tos -n \
    --work-dir ~/redirected/certs --config-dir ~/redirected/certs --logs-dir ~/redirected/certs \
    --webroot-path ~/redirected/app/src/ \
    -d ${domain}  \
    -m francois+dns@garnet.center --no-eff-email`
)

const dnsCheckPostSchema = yup.object({
  domain: yup.string().matches(SUB_DOMAIN_REG).required()
}).required()
export const dnsCheckPost: Middleware = async (ctx, next) => {
  if (ctx.path !== '/dns' || ctx.method !== 'POST') return next()
  const { domain } = dnsCheckPostSchema.validateSync(ctx.state.body)
  const cnameDomaines = await getCname(domain)
  console.log('DNS for ', { domain, cnameDomaines })
  const isValid = cnameDomaines.includes('redirected.app')
  ctx.body = { isValid }
  if (isValid && isProd && !hasCertificate(domain)) await createCertificate(domain)
}