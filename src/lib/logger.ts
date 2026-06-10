type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const minLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

export function createLogger(scope: string) {
  const prefix = `[${scope}]`;

  function log(level: LogLevel, message: string, data?: unknown) {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    if (data !== undefined) fn(prefix, message, data);
    else fn(prefix, message);
  }

  return {
    debug: (message: string, data?: unknown) => log('debug', message, data),
    info: (message: string, data?: unknown) => log('info', message, data),
    warn: (message: string, data?: unknown) => log('warn', message, data),
    error: (message: string, data?: unknown) => log('error', message, data),
  };
}
