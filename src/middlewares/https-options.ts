import fs from 'node:fs';
import tls from 'node:tls';
import type https from 'node:https';
import devcert from 'devcert';
import {projectRoot} from '../lib/helpers.js';

const IS_PROD = process.env.NODE_ENV === 'production';

const DEV_DOMAINS = {};//! IS_PROD && await devcert.certificateFor(['localhost', 'redirected.test'])
const certDatabase = IS_PROD
	? async (domain: string) => {
		const dir = `${projectRoot()}/../certs/live/${domain}`;
		const exists = fs.existsSync(dir);
		console.log({domain, exists});
		return {
			key: fs.readFileSync(`${dir}/privkey.pem`),
			cert: fs.readFileSync(`${dir}/fullchain.pem`),
		};
	}
	: async () => DEV_DOMAINS; // If this step is blocking, you probably need to type your password in the process to authorize the dev CA creation. @see https://github.com/davewasmer/devcert#how-it-works

export const httpsOptions: https.ServerOptions = {
	async SNICallback(domain, cb) {
		certDatabase(domain)
			.then(cert => {
				cert && cb(null, tls.createSecureContext(cert));
			})
			.catch(error => {
				cb(error);
			});
	},
};
