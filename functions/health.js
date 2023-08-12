export function onRequest(context,) {
  return new Response(JSON.stringify(context), {
    headers: {
      body: context.request.body.toString()
    }
  })
}
