import crypto from 'crypto-browserify';
import { PagesFunction } from '../lib/types';
 
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const body = await request.json() as { domain?: string }
  const domain = body.domain;
  if (domain == null || !domain.includes('.')) throw Error('invalid domain');

  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });

  console.log({ privateKey, publicKey })

  return new Response('ok', { status: 200 })
}
