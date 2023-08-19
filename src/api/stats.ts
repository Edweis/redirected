import { Middleware } from "koa";
import { db } from "../lib/database.js";
import { hasCertificate } from "./dns.js";
import fs from 'fs/promises'
import { projectRoot } from "../lib/helpers.js";


export const stats: Middleware = async (ctx, next) => {
  const statPathFile = projectRoot() + '/../.stats-path'
  const statPath = await fs.readFile(statPathFile).then(d => d.toString().trim()).catch(() => '/stats');
  
  if (ctx.path !== statPath || ctx.method !== 'GET') return next();

  const travels = await db.all<Array<{ domain: string, pathname: string, count: number }>>(`
    SELECT domain, pathname, COUNT(status) as count 
    FROM travels
    WHERE status < 400 AND ( redirectedTo IS NULL OR redirectedTo != 'https://redirected.app' )
    GROUP BY domain, pathname
    ORDER by count DESC, domain;`
  )
  const entries = await db.all<Array<{ domain: string, pathname: string, count: number }>>(`
    SELECT domain, ('/'||pathname) as pathname, 0 as count 
    FROM redirects
    WHERE deletedAt IS NULL;`
  )
  let travelsGrp: Record<string, Record<string, number>> = {};
  [...travels, ...entries].forEach(res => {
    const hasCert = hasCertificate(res.domain)
    const domain = hasCert ? '*' + res.domain : res.domain;
    if (travelsGrp[domain] == null) travelsGrp[domain] = {}
    travelsGrp[domain][res.pathname] = travelsGrp[domain][res.pathname] || res.count;
  })

  travelsGrp = Object.fromEntries(Object.entries(travelsGrp).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)))

  ctx.body = travelsGrp
}