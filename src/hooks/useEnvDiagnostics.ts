import { useMemo } from 'react';
import { env } from '../config/env';

/**
 * useEnvDiagnostics
 * Returns an array of warning strings when required environment values are missing or suspicious.
 * Intended for dev-time visibility only; avoid blocking app start.
 */
export function useEnvDiagnostics() {
  const warnings = useMemo(() => {
    const issues: string[] = [];

    if (!env.SUPABASE_URL) {
      issues.push('VITE_SUPABASE_URL is missing or invalid.');
    }
    if (!env.SUPABASE_ANON_KEY) {
      issues.push('VITE_SUPABASE_ANON_KEY is missing.');
    }

    // Add simple heuristic checks
    if (env.SUPABASE_URL && !/^https?:\/\//i.test(env.SUPABASE_URL)) {
      issues.push('VITE_SUPABASE_URL should start with http(s)://');
    }

    return issues;
  }, []);

  return { warnings };
}
