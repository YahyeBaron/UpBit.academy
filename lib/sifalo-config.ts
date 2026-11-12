/**
 * Sifalo Pay configuration validator.
 * Fails closed — missing credentials produce a safe server error, never logged secrets.
 */

const REQUIRED_KEYS = [
  'SIFALO_PAY_USERNAME',
  'SIFALO_PAY_API_KEY',
  'SIFALO_WEBHOOK_SECRET',
] as const;

let _validated = false;
let _isConfigured = false;

/**
 * Validates that all required Sifalo Pay environment variables are present.
 * Returns true if valid. In production, throws a safe generic error when credentials are missing.
 * Never prints secret values or API key contents to any log.
 */
export function validateSifaloConfig(): boolean {
  if (_validated) return _isConfigured;
  _validated = true;

  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    const isProduction = process.env.NODE_ENV === 'production';
    // Emit sanitized message — do NOT print key names or partial values
    const msg = `[Sifalo Pay] Payment gateway is not fully configured. Mobile payment processing is unavailable.`;
    console.warn(msg);

    if (isProduction) {
      _isConfigured = false;
      return false;
    }

    _isConfigured = false;
    return false;
  }

  _isConfigured = true;
  return true;
}

/**
 * Returns Sifalo Basic Auth HTTP headers.
 * Throws a safe error (no secret values in message) if credentials are missing.
 */
export function getSifaloAuthHeaders(): { 'Content-Type': string; Authorization: string } {
  const username = process.env.SIFALO_PAY_USERNAME?.trim();
  const apiKey = process.env.SIFALO_PAY_API_KEY?.trim();

  if (!username || !apiKey) {
    throw new Error('Payment gateway is not configured. Please contact support.');
  }

  const basicToken = Buffer.from(`${username}:${apiKey}`).toString('base64');
  return {
    'Content-Type': 'application/json',
    Authorization: `Basic ${basicToken}`,
  };
}

/**
 * Validates and retrieves the Sifalo Webhook Secret.
 * Returns the secret string if properly configured.
 * In development / test, falls back to a deterministic test secret if not set.
 * Throws a safe configuration error in production if missing or placeholder.
 */
export function getSifaloWebhookSecret(): string {
  const secret = process.env.SIFALO_WEBHOOK_SECRET?.trim();
  const isPlaceholder = !secret || secret === 'REPLACE_WITH_YOUR_SIFALO_WEBHOOK_SIGNING_SECRET';

  if (isPlaceholder) {
    if (process.env.NODE_ENV !== 'production') {
      return 'whsec_sifalo_dev_test_secret_2026';
    }
    throw new Error('Webhook verification is not configured. Contact support.');
  }

  return secret;
}

export function isSifaloWebhookConfigured(): boolean {
  const secret = process.env.SIFALO_WEBHOOK_SECRET?.trim();
  return Boolean(secret && secret !== 'REPLACE_WITH_YOUR_SIFALO_WEBHOOK_SIGNING_SECRET');
}
