export function onRequest({request, functionPath}) {
  return new Response(JSON.stringify({request, functionPath}), {
    headers: {
      body: JSON.stringify(request.body.json())
    }
  })
}
