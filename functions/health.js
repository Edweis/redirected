export function onRequest(context,) {
  return new Response(JSON.stringify(context), {
    headers: {
      body: JSON.stringify(context.request.body)
    }
  })
}
