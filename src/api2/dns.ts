import * as yup from 'yup'
import { Middleware } from '../lib/types.js'
import fs from 'fs'
import { SUB_DOMAIN_REG, projectRoot } from '../lib/helpers.js'
import mem from 'mem';
import { execPromise } from '../middlewares/helpers.js'

const isProd = process.env.NODE_ENV === 'production'
const certPath = `${projectRoot()}/../certs/live`

export const getCname = mem(
  async (domain: string) => execPromise(`dig ${domain} cname +trace +short`),
  { maxAge: 1000 }
)
export const hasCertificate = (domain: string) => fs.existsSync(`${certPath}/${domain}/fullchain.pem`)
export const createCertificate = async (domain: string) => execPromise(`
  certbot certonly --webroot --agree-tos -n \
    --work-dir ~/redirected/certs --config-dir ~/redirected/certs --logs-dir ~/redirected/certs \
    --webroot-path ~/redirected/app/src/ \
    -d ${domain}  \
    -m francois+dns@garnet.center --no-eff-email`
)


