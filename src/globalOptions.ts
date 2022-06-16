import type { GlobalOptions } from './types.js';
import defaultLogger from './logger.js';

export const global: GlobalOptions = {
  logExecutionStart: false,
  logResult: false,
  parseError: (e: any) => e,
  logger: defaultLogger,
  prometheusBuckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10],
};

export const setGlobalOptions = ({ logExecutionStart, logResult, parseError, prometheusBuckets, logger }: Partial<GlobalOptions>) => {
  if (logger) {
    global.logger = logger;
  }

  if (prometheusBuckets) {
    global.prometheusBuckets = prometheusBuckets;
  }

  if (typeof logExecutionStart !== 'undefined') {
    global.logExecutionStart = logExecutionStart;
  }

  if (typeof logResult !== 'undefined') {
    global.logResult = logResult;
  }

  if (parseError) {
    global.parseError = parseError;
  }
};
