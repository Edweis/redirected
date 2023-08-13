import * as yup from 'yup'
import { PagesFunction } from '../lib/types'
  
const toUrl = (str:string) => {
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

export const onRequestPut: PagesFunction = async ({ request, env }) => {
  const body = await request.json()
  const { from, to } = validate(body)
  const key = from.replace(/^https?:\/\//, '')

  console.log({ key, to })
  await env.REDIRECTED_KV.put(key, to)

  return new Response(null, { status: 200 })
}

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const _domain = new URLSearchParams(url.search).get('domain')
  const domain = yup.string().required().validateSync(_domain)


  const prefix = domain + '/'
  const response = await env.REDIRECTED_KV.list({ prefix })
  const keys = await Promise.all(response.keys.map(async k => ({
    key: k.name,
    value: await env.REDIRECTED_KV.get(k.name)
  })))
  return new Response(JSON.stringify(keys), { status: 200 })
}
