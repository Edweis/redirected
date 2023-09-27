import fs from 'node:fs';
import mem from 'mem';
import { projectRoot } from '../lib/helpers.js';
import { execPromise } from '../middlewares/helpers.js';

const certPath = `${projectRoot()}/../certs/live`;

export const getCname = mem(
  async (domain: string) => execPromise(`dig ${domain} cname +trace +short`),
  { maxAge: 1000 },
);
export const hasCertificate = (domain: string) => fs.existsSync(`${certPath}/${domain}/fullchain.pem`);
export const createCertificate = async (domain: string) => execPromise(`
  certbot certonly --webroot --agree-tos -n \
    --work-dir        /var/www/redirected/certs \
    --config-dir      /var/www/redirected/certs \
    --logs-dir        /var/www/redirected/certs \
    --webroot-path    /var/www/redirected/app/ \
    -d ${domain}  \
    -m dns@redirected.app --no-eff-email`,
);

