import  crypto from 'node:crypto';
export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const domain = body.domain;
  if(domain==null || !domain.includes('.')) throw Error('invalid domain');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  console.log({privateKey, publicKey})

  return new Response(JSON.stringify(keys), { status: 200 })
}
