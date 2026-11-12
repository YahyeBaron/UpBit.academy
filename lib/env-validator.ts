import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for database connectivity'),

  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),

  // Sifalo Pay (Primary Payment Gateway)
  SIFALO_PAY_USERNAME: z.string().min(1, 'SIFALO_PAY_USERNAME is required'),
  SIFALO_PAY_API_KEY: z.string().min(1, 'SIFALO_PAY_API_KEY is required'),
  SIFALO_PAY_API_URL: z.string().url('SIFALO_PAY_API_URL must be a valid URL').default('https://api.sifalopay.com/v1/payment'),
  SIFALO_WEBHOOK_SECRET: z.string().min(1, 'SIFALO_WEBHOOK_SECRET is required for payment callback verification'),

  // Admin Setup (Optional in dev, recommended in prod)
  ADMIN_PASSWORD: z.string().optional(),

  // Mux Video Webhook (Optional)
  MUX_WEBHOOK_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

/**
 * Validates process.env variables against the schema.
 * In production, throws a GENERIC error without logging which specific values are missing or invalid.
 * Never logs secret values or key contents.
 */
export function validateEnv(): EnvConfig {
  if (validatedEnv) return validatedEnv;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    if (process.env.NODE_ENV === 'production') {
      // Never reveal which keys or values failed in production logs
      console.error('[Env] Server configuration is invalid. Check deployment environment variables.');
      throw new Error('Server configuration error. Contact the system administrator.');
    }

    // In development only: list which *fields* (not values) are misconfigured
    const fieldNames = result.error.issues.map((issue) => issue.path.join('.'));
    console.error(`[Env] Missing or invalid environment variables: ${fieldNames.join(', ')}`);
  }

  validatedEnv = (result.success ? result.data : process.env) as EnvConfig;
  return validatedEnv;
}
