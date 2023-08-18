import * as yup from 'yup'
import { Middleware } from '../lib/types.js'
import { Redirect, RedirectNew, db } from '../lib/database.js'
import { execPromise } from '../middlewares/helpers.js'
import { hasCertificate } from './dns.js'

const DISABLE_OUR_REDIRECT = false

const schemaRedirectPut: yup.ObjectSchema<RedirectNew> = yup.object({
  domain: yup.string().required(),
  pathname: yup.string().matches(/^\w/).required(),
  destination: yup.string().transform(u => 'https://' + u).url().required()
}).required()
export const redirectPost: Middleware = async (ctx, next) => {
  if (ctx.path !== '/redirects' || ctx.method !== 'POST') return next()
  const { domain, pathname, destination } = schemaRedirectPut.validateSync(ctx.state.body)
  if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') { ctx.status = 401; return }
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
  if (domain == null || ctx.method !== 'GET') return next()

  const redirects = await db.all<Redirect[]>(
    `SELECT * FROM redirects WHERE domain = $1 AND deletedAt IS NULL ORDER BY createdAt`,
    [domain]
  )
  console.log('redirects found for ' + domain, redirects.length, hasCertificate(domain))
  ctx.body = { redirects, isValid: hasCertificate(domain) }
}


export const redirectDelete: Middleware = async (ctx, next) => {
  const match = /\/redirects\/([\w\.]+)\/(.+)/.exec(ctx.path)
  if (match == null || ctx.method !== 'DELETE') return next();
  const [, domain, pathname] = match;
  if (DISABLE_OUR_REDIRECT && domain === 'redirected.app') { ctx.status = 401; return }

  await db.all(
    `UPDATE redirects SET deletedAt = datetime('now') 
      WHERE domain = $1 AND pathname = $2;`,
    [domain, pathname]
  )
  ctx.body = undefined;
}

const mapNsToUrl = [
  {
    name: 'AWS Route 53',
    regex: /awsdns/,
    url: 'https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones',
    text: (domain: string) => `AWS > Route 53 > Hosted Zones > ${domain} > Create record`
  },
  {
    name: 'Cloudflare DNS',
    regex: /cloudflare/,
    url: 'https://dash.cloudflare.com/',
    text: (domain: string) => `Domain registration > Manage domain > ${domain} > Update DNS configuration`
  },
  {
    name: 'Google DNS',
    regex: /google/,
    url: () => 'https://console.cloud.google.com/net-services/dns/',
    instruction: 'https://cloud.google.com/identity/docs/add-cname',
    text: (domain: string) => `${domain} > Zone details > Add standard`
  },
  {
    name: 'OVH DNS',
    regex: /ovh/,
    url: () => 'https://www.ovh.com/auth/?action=gotomanager&from=https://www.ovh.co.uk/&ovhSubsidiary=GB',
    instruction: 'https://help.ovhcloud.com/csm/en-gb-dns-edit-dns-zone?id=kb_article_view&sysparm_article=KB0039608',
    text: (domain: string) => `Web Cloud > Domain names > ${domain} > DNS Zone > Add an entry`
  },
  {
    name: 'Go Daddy',
    regex: /domaincontrol/,
    url: (domain: string) => 'https://dcc.godaddy.com/control/portfolio/' + domain + '/settings?tab=dns&itc=mya_vh_buildwebsite_domain',
    instruction: 'https://www.godaddy.com/help/manage-dns-records-680',
    text: (domain: string) => `Web Cloud > Domain names > ${domain} > DNS Zone > Add an entry`
  },
  {
    name: 'Name cheap',
    regex: /wixdns/,
    url: (domain: string) => `https://ap.www.namecheap.com/Domains/DomainControlPanel/${domain}/advancedns`,
    instruction: 'https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/',
    text: (domain: string) => `Domain list > ${domain} > Manage > Advanced DNS > Hosted records > Add news records`
  },
]
const omit = <T extends Record<any, any>, K extends keyof T>(obj: T, key: K): Omit<T, K> => {
  if (obj == null) return obj
  const clone = Object.assign({}, obj);
  delete clone[key];
  return clone
}
export const redirectDoc: Middleware = async (ctx, next) => {
  const domain = /\/redirects\/([\w\.]+)\/docs/.exec(ctx.path)?.[1]
  if (domain == null || ctx.method !== 'GET') return next();
  const nsServers = await execPromise(`dig ${domain} ns +short`);
  const selectedNs = mapNsToUrl.find(n => n.regex.test(nsServers));
  ctx.body = {
    selected: selectedNs && omit(selectedNs, 'regex'),
    all: mapNsToUrl.map(item => omit(item, 'regex'))
  }

}