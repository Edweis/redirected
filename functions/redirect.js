import * as yup from 'yup';

const schema = yup.object({
  from: yup.string().url().required(),
  to: yup.string().url().required()
}).required()
export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json()
    const { from, to } = await schema.validate(body)
    const key = from.replace(/^https?:\/\//, '')
    
    console.log({key, to})
    await env.REDIRECTED_KV.put(key, to)
    return new Response('All good!', { status: 200 })
  } catch (e) {
    console.error(e)
    return new Response(e.message, { status: 400 })
  }
}
