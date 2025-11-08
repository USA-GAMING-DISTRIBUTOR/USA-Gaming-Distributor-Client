import { z } from 'zod';
import { logger } from '../lib/logger';

/**
 * Runtime environment validation. Extend as new vars are added.
 */
const EnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),
  // Future: add log level, feature flags, etc.
});

// Collect only the variables we care about to avoid leaking the whole import.meta.env
const raw = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

const parsed = EnvSchema.safeParse(raw);

if (!parsed.success) {
  // Aggregate errors for developer visibility
  logger.error('[env] Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  // In production we could throw to fail fast; for now continue with empty strings to avoid hard crash during setup.
}

export const env = {
  SUPABASE_URL: parsed.success ? parsed.data.VITE_SUPABASE_URL : '',
  SUPABASE_ANON_KEY: parsed.success ? parsed.data.VITE_SUPABASE_ANON_KEY : '',
};

export type Env = typeof env;
