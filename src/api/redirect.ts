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
  if (domain == null || ctx.method !== 'GET') return next()

  const redirects = await db.all<Redirect[]>(
    `SELECT * FROM redirects WHERE domain = $1 AND deletedAt IS NULL`,
    [domain]
  )
  ctx.body = redirects
}


export const redirectDelete: Middleware = async (ctx, next) => {
  const domain = /\/redirects\/([\w\.]+)/.exec(ctx.path)?.[1]
  if (domain == null || ctx.method !== 'DELETE') return next();
  await db.all(
    `UPDATE your_table SET deletedAt = datetime('now') WHERE domain = $1;`,
    [domain]
  )
  ctx.body = undefined;
}

const mapNsToUrl = [
  {
    name: 'AWS Route 53',
    regex: /awsdns/,
    url: 'https://us-east-1.console.aws.amazon.com/route53/v2/hostedzones',
    text: domain => `AWS > Route 53 > Hosted Zones > ${domain} > Create record`
  },
  {
    name: 'Cloudflare DNS',
    regex: /cloudflare/,
    url: 'https://dash.cloudflare.com/',
    text: domain => `Domain registration > Manage domain > ${domain} > Update DNS configuration`
  },
  {
    name: 'Google DNS',
    regex: /google/,
    url: () => 'https://console.cloud.google.com/net-services/dns/',
    instruction: 'https://cloud.google.com/identity/docs/add-cname',
    text: domain => `${domain} > Zone details > Add standard`
  },
  {
    name: 'OVH DNS',
    regex: /ovh/,
    url: () => 'https://www.ovh.com/auth/?action=gotomanager&from=https://www.ovh.co.uk/&ovhSubsidiary=GB',
    instruction: 'https://help.ovhcloud.com/csm/en-gb-dns-edit-dns-zone?id=kb_article_view&sysparm_article=KB0039608',
    text: domain => `Web Cloud > Domain names > ${domain} > DNS Zone > Add an entry`
  },
  {
    name: 'Go Daddy',
    regex: /domaincontrol/,
    url: domain => 'https://dcc.godaddy.com/control/portfolio/' + domain + '/settings?tab=dns&itc=mya_vh_buildwebsite_domain',
    instruction: 'https://www.godaddy.com/help/manage-dns-records-680',
    text: domain => `Web Cloud > Domain names > ${domain} > DNS Zone > Add an entry`
  },
  {
    name: 'Name cheap',
    regex: /wixdns/,
    url: domain => `https://ap.www.namecheap.com/Domains/DomainControlPanel/${domain}/advancedns`,
    instruction: 'https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/',
    text: domain => `Web Cloud > Domain names > ${domain} > DNS Zone > Add an entry`
  },
]
export const redirectDoc: Middleware = async (ctx, next) => {
  const domain = /\/redirects\/([\w\.]+)\/docs/.exec(ctx.path)?.[1]
  if (domain == null || ctx.method !== 'GET') return next();

}