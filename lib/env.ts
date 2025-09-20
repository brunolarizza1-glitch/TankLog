import { z } from 'zod';

const envSchema = z.object({
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'Supabase service role key is required'),

  // Stripe (optional for basic functionality)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Postmark (optional for basic functionality)
  POSTMARK_API_TOKEN: z.string().optional(),

  // App
  APP_URL: z.string().url('Invalid app URL').default('http://localhost:3000'),
  PDF_SIGNING_SECRET: z.string().optional(),
});

// Parse and validate environment variables with better error messages
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors
      .filter(
        (err) => err.code === 'invalid_type' && err.received === 'undefined'
      )
      .map((err) => err.path.join('.'));

    const invalidVars = error.errors
      .filter(
        (err) => err.code !== 'invalid_type' || err.received !== 'undefined'
      )
      .map((err) => `${err.path.join('.')}: ${err.message}`);

    let errorMessage = 'Environment validation failed:\n';

    if (missingVars.length > 0) {
      errorMessage += `Missing required variables: ${missingVars.join(', ')}\n`;
    }

    if (invalidVars.length > 0) {
      errorMessage += `Invalid variables: ${invalidVars.join(', ')}\n`;
    }

    errorMessage +=
      '\nPlease check your .env.local file and ensure all required variables are set.';

    throw new Error(errorMessage);
  }
  throw error;
}

export { env };

export type Env = z.infer<typeof envSchema>;
