import dns from 'dns';

const toUrl = (str) => {
  try {
    return new URL(str).toString()
  } catch {
    throw new Error(str + ' is not a valid URL.')
  }
}

const validate = (data) => {
  const from = toUrl('https://' + data.domain + '/' + data.from)
  const to = toUrl(data.to)
  return { from, to }
}

export async function onRequestPut({ request, env }) {
  const body = await request.json()
  const { from, to } = validate(body)
  const key = from.replace(/^https?:\/\//, '')

  console.log({ key, to })
  await env.REDIRECTED_KV.put(key, to)

  return new Response(null, { status: 200 })
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const domain = new URLSearchParams(url.search).get('domain') || undefined
  if (domain == null) throw Error('domain is missing.')


  const prefix = domain + '/'
  const response = await env.REDIRECTED_KV.list({ prefix })
  const keys = await Promise.all(response.keys.map(async k => ({
    key: k.name,
    value: await env.REDIRECTED_KV.get(k.name)
  })))
  const domains=await new Promise((res, rej) =>
    dns.resolve(domain, 'CNAME', (err, result) => err ? rej(err) : res(result)))
    console.log(domains)
  return new Response(JSON.stringify(keys), { status: 200 })
}
