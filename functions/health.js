export async function onRequest({request, env}) {
  return new Response('I am good!', {status:200})
}
