// Encrypt mi/data/items.json into mi/data/items.enc (AES-256-GCM) so the
// public repository holds only ciphertext. The key travels in the page's
// link fragment (#k=...), which browsers never send to the server.
//
// Usage:  MI_KEY=<key from your link> node mi/encrypt.mjs   # re-encrypt, same link
//         node mi/encrypt.mjs                                # new key, new link
//         MI_KEY=<key> node mi/encrypt.mjs --decrypt         # restore items.json (and its labels)
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const dir = new URL('./data/', import.meta.url);
if (process.argv.includes('--decrypt')) {
    const enc = JSON.parse(readFileSync(new URL('items.enc', dir), 'utf8'));
    const key = await crypto.subtle.importKey('raw', Buffer.from(process.env.MI_KEY, 'base64url'), 'AES-GCM', false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(enc.iv, 'base64') }, key, Buffer.from(enc.data, 'base64'));
    writeFileSync(new URL('items.json', dir), Buffer.from(plain));
    console.log('wrote mi/data/items.json');
    process.exit(0);
}
const plain = readFileSync(new URL('items.json', dir));
const raw = process.env.MI_KEY ? Buffer.from(process.env.MI_KEY, 'base64url') : crypto.getRandomValues(new Uint8Array(32));
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
writeFileSync(new URL('items.enc', dir), JSON.stringify({
    iv: Buffer.from(iv).toString('base64'), data: Buffer.from(data).toString('base64'),
}));
console.log('wrote mi/data/items.enc');
console.log('link: https://vasilyevivan.github.io/web-page/mi/#k=' + Buffer.from(raw).toString('base64url'));
