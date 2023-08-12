

class Cloudflare {
  AUTH_KEY = "f1223a019f843dbfd4a6037536a802c726e4b"
  AUTH_EMAIL = "francois@garnet.center"
  HEADERS =  { 'Content-Type': 'application/json', 'X-Auth-Key': this.AUTH_KEY, 'X-Auth-Email': this.AUTH_EMAIL }
  ACCOUNT_ID = 'a3326b5911601c160d3c52e46e4e8320'
  PROJECT_NAME = 'redirected'
  BASE_URL='https://api.cloudflare.com/client/v4'

  async addCustomDomain(name) {
    const url = `${this.BASE_URL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains`
    return fetch(url, { method: 'POST', headers: this.HEADERS, body: JSON.stringify({ name }) })
      .then(res => res.json())
      .then(json => console.log(json))
  }

  async getCustomDomain(name){
    const url = `${this.BASE_URL}/accounts/${this.ACCOUNT_ID}/pages/projects/${this.PROJECT_NAME}/domains`
    return fetch(url, { method: 'GET', headers: this.HEADERS })
      .then(res => res.json())
      .then(json => console.log(json))
  }
}
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
  return new Response(JSON.stringify(keys), { status: 200 })
}
