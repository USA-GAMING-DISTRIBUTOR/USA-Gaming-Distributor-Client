import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { env } from '../config/env';

import type { Database } from '../types/database.types';

if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
  logger.error('[supabase] Missing required Supabase environment variables.');
}

/**
 * Singleton Supabase client typed with generated Database types.
 * Consumers should import from this module to avoid multiple client instances.
 */
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Legacy interface removed; rely on generated Database types.
