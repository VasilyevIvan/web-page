// Encrypt twf/data/weeks.json into twf/data/weeks.enc (AES-256-GCM) so the
// public repository holds only ciphertext. The key travels in the page's
// link fragment (#k=...), which browsers never send to the server.
//
// Usage:  TWF_KEY=<key from your link> node twf/encrypt.mjs   # re-encrypt, same link
//         node twf/encrypt.mjs                                # new key, new link
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const dir = new URL('./data/', import.meta.url);
const plain = readFileSync(new URL('weeks.json', dir));
const raw = process.env.TWF_KEY ? Buffer.from(process.env.TWF_KEY, 'base64url') : crypto.getRandomValues(new Uint8Array(32));
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
writeFileSync(new URL('weeks.enc', dir), JSON.stringify({
    iv: Buffer.from(iv).toString('base64'), data: Buffer.from(data).toString('base64'),
}));
console.log('wrote twf/data/weeks.enc');
console.log('link: https://vasilyevivan.github.io/web-page/twf/#k=' + Buffer.from(raw).toString('base64url'));
