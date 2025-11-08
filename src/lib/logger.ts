type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = import.meta.env.MODE === 'production';

/**
 * Low-level logger function used by `logger` facade.
 * - Hides debug logs in production builds.
 * - Delegates to the appropriate console method with a level prefix.
 */
const log = (level: LogLevel, ...args: unknown[]) => {
  if (level === 'debug' && isProd) return;
  const prefix = `[${level.toUpperCase()}]`;
  const method: 'log' | 'info' | 'warn' | 'error' = level === 'debug' ? 'log' : level;
  console[method](prefix, ...args);
};

/** Public logging facade; prefer this over raw console calls. */
export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info: (...args: unknown[]) => log('info', ...args),
  warn: (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
