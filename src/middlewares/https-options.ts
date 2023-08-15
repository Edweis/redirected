import fs from 'fs';
import devcert from 'devcert';
import tls from 'tls';
import type https from 'https'
import { projectRoot } from '../lib/helpers.js';
const IS_PROD = process.env.NODE_ENV === 'production'

const DEV_DOMAINS = !IS_PROD && await devcert.certificateFor(['localhost', 'redirected.test'])
const certDatabase = IS_PROD
  ? async (domain: string) => {
    const dir = `${projectRoot()}/../certs/live/${domain}`
    console.log({dir})
    return {
      key: fs.readFileSync(`${dir}/privkey.pem`),
      cert: fs.readFileSync(`${dir}/fullchain.pem`)
    }
  }
  : async () => DEV_DOMAINS // if this step is blocking, you probably need to type your password in the process to authorize the dev CA creation. @see https://github.com/davewasmer/devcert#how-it-works

export const httpsOptions: https.ServerOptions = {
  SNICallback(domain, cb) {
    certDatabase(domain)
      .then(cert => tls.createSecureContext(cert))
      .then(ctx => cb(null, ctx))
      .catch(err => cb(err, null))
  },
}
 