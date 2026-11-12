/**
 * scripts/generate-mux-keypair.ts
 *
 * Generates an RSA 2048-bit key pair formatted specifically for Mux Signed Playback.
 *
 * Usage:
 *   pnpm tsx scripts/generate-mux-keypair.ts
 */
import { generateKeyPairSync } from 'crypto';

console.log('\n🔐 Generating 2048-bit RSA Keypair for Mux Signed URLs...\n');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

const privateKeyBase64 = Buffer.from(privateKey, 'utf-8').toString('base64');

console.log('═════════════════════════════════════════════════════════════════════');
console.log('1. PUBLIC KEY (Upload this to Mux Dashboard or Mux Signing API):');
console.log('═════════════════════════════════════════════════════════════════════');
console.log(publicKey);

console.log('═════════════════════════════════════════════════════════════════════');
console.log('2. PRIVATE KEY (BASE64 ENCODED - Recommended for .env):');
console.log('═════════════════════════════════════════════════════════════════════');
console.log(`MUX_SIGNING_PRIVATE_KEY="${privateKeyBase64}"\n`);

console.log('═════════════════════════════════════════════════════════════════════');
console.log('3. NEXT STEPS:');
console.log('═════════════════════════════════════════════════════════════════════');
console.log('1. Log into your Mux Dashboard: https://dashboard.mux.com/settings/signing-keys');
console.log('2. Click "Generate new signing key" (or upload this public key).');
console.log('3. Copy the Signing Key ID (e.g. k01xxxxxxx) into your .env:');
console.log('   MUX_SIGNING_KEY_ID="your_key_id"');
console.log('4. Copy the Private Key above into your .env:');
console.log('   MUX_SIGNING_PRIVATE_KEY="..."\n');
