import { appEnv, validateEnv } from './config/env';
import { createLogger } from './logger';

const log = createLogger('bootstrap');

let booted = false;

export function bootstrap(): void {
  if (booted) return;
  booted = true;

  for (const warning of validateEnv()) {
    log.warn(warning);
  }

  log.info('application bootstrapped', { mode: appEnv.mode, appName: appEnv.appName });
}
