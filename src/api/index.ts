import fs from 'node:fs/promises';
import Router from '@koa/router';
import { type Redirect, db } from '../lib/database.js';
import { render } from '../lib/render.js';
import { projectRoot } from '../lib/helpers.js';
import { createCertificate, getCname, hasCertificate } from './dns.js';

const isProd = process.env.NODE_ENV === 'production';
const DISABLE_OUR_REDIRECT = true;
const router = new Router();
const SUB_DOMAIN_REGEX
	= /^(?:[\dA-Za-z](?:[\dA-Za-z-]{0,61}[\dA-Za-z])?\.)+[A-Za-z]{2,7}$/;

router.get('/', async ctx => {
	const { domain } = ctx.query;

	// Validate domain 
	const isDomainValid = typeof domain === 'string' && SUB_DOMAIN_REGEX.test(domain);
	if (!isDomainValid) {
		const errors = domain == null ? {} : { domain: 'Incorrect domain' }
		ctx.body = render('main', { domain, errors });
		return;
	}

	// get redirects
	const redirects = await db.all<Redirect[]>(`
		SELECT r.pathname, r.destination, COUNT(t.createdAt) as count FROM redirects r
		LEFT JOIN travels t 
			ON r.domain = t.domain AND t.pathname = '/' || r.pathname
		WHERE r.domain = $1 
			AND r.deletedAt IS NULL 
		GROUP BY r.pathname, r.destination
		ORDER BY r.createdAt`,
		[domain],
	);
	console.log(redirects, { domain }, await db.all(`SELECT * FROM travels WHERE domain = $1`, [domain]))
	ctx.body = render(
		'main',
		{ redirects: redirects, domain, isValid: hasCertificate(domain) }
	);
});

router.post('/', async ctx => {
	const { domain, pathname, destination } = (ctx.state.body);
	if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') {
		ctx.status = 401; return;
	}
	await db.run(
		`INSERT INTO redirects (domain,  pathname, destination, deletedAt) 
      VALUES ($1, $2, $3, NULL)
      ON CONFLICT(domain, pathname) DO UPDATE SET
        destination = $3,
        createdAt = datetime('now'),
        deletedAt = NULL;`,
		[domain, pathname, destination],
	);
	ctx.body = render('main?redirects', { domain, redirects: [{ domain, pathname, destination, count: 0 }] });
});

router.delete('/', async ctx => {
	const { domain, pathname } = ctx.request.query;
	console.log({ domain, pathname }, ctx.url);
	if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') {
		ctx.status = 401; return;
	}

	await db.all(
		`UPDATE redirects SET deletedAt = datetime('now') 
      WHERE domain = $1 AND pathname = $2;`,
		[domain, pathname],
	);
	ctx.status = 200;
});

router.post('/dns', async ctx => {
	const domain = ctx.request.query.domain as string;
	if (domain == null) {
		ctx.status = 400; return;
	}

	const cnameDomaines = await getCname(domain);
	console.log('DNS for', { domain, cnameDomaines });
	const isValid = cnameDomaines.includes('redirected.app');

	const message = isValid ? '✅ DNS is set!' : '🤷‍♂️ DNS is not setup for ' + domain
	if (isValid && isProd && !hasCertificate(domain))
		await createCertificate(domain);
	ctx.body = render('main?dns-res', { dns: { message, isValid } })
});

router.get('/stats', async (ctx,) => {
	const travels = await db.all<Array<{ domain: string; pathname: string; count: number }>>(`
      SELECT domain, pathname, COUNT(status) as count 
      FROM travels
      WHERE status < 400 AND ( redirectedTo IS NULL OR redirectedTo != 'https://redirected.app' )
      GROUP BY domain, pathname
      ORDER by count DESC, domain;`,
	);
	const entries = await db.all<Array<{ domain: string; pathname: string; count: number }>>(`
      SELECT domain, ('/'||pathname) as pathname, 0 as count 
      FROM redirects
      WHERE deletedAt IS NULL;`,
	);
	let travelsGrp: Record<string, Record<string, number>> = {};
	for (const res of [...travels, ...entries]) {
		const hasCert = hasCertificate(res.domain);
		const domain = hasCert ? '*' + res.domain : res.domain;
		if (travelsGrp[domain] == null) {
			travelsGrp[domain] = {};
		}

		travelsGrp[domain][res.pathname] = travelsGrp[domain][res.pathname] || res.count;
	}

	travelsGrp = Object.fromEntries(Object.entries(travelsGrp).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

	ctx.body = travelsGrp;
});

export default router;
