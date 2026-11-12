import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';

(process.env as Record<string, string>).NODE_ENV = 'test';
(process.env as Record<string, string>).ALLOW_STATIC_PROMO_FALLBACK = 'true';

console.log('🚀 Running E-Learning Platform Test Harness...');

const testFiles = [
  path.resolve(process.cwd(), 'tests/auth-policy.test.ts'),
  path.resolve(process.cwd(), 'tests/progress-engine.test.ts'),
  path.resolve(process.cwd(), 'tests/promo-payment.test.ts'),
  path.resolve(process.cwd(), 'tests/phase3-decimal-orders.test.ts'),
  path.resolve(process.cwd(), 'tests/phase4-5-atomic-checkout.test.ts'),
  path.resolve(process.cwd(), 'tests/phase5-9-comprehensive.test.ts'),
  path.resolve(process.cwd(), 'tests/payment-audit.test.ts'),
  path.resolve(process.cwd(), 'tests/course-management.test.ts'),
  path.resolve(process.cwd(), 'tests/email-automation.test.ts'),
  path.resolve(process.cwd(), 'tests/mux-signing.test.ts'),
  path.resolve(process.cwd(), 'tests/webhook-and-certificate-audit.test.ts'),
];

run({
  files: testFiles,
})
  .compose(spec)
  .pipe(process.stdout);
