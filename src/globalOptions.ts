import type { Level } from 'pino';
import pino from 'pino';
import type { GlobalOptions } from './types.js';
import defaultLogger from './logger.js';
import BaseLogger = pino.BaseLogger;

export let logResult = false;
export let logExecutionStart = false;
export let parseError: (e: any) => any = (e: any) => e;
export let prometheusBuckets: number[] = [0.003, 0.03, 0.1, 0.3, 1.5, 10];
export let errorLogLevel: Level = 'error';

export let logger: BaseLogger = defaultLogger;

export const setGlobalOptions = ({
  logExecutionStart: optionalLogExecutionStart,
  logResult: optionalLogResult,
  parseError: optionalParseError,
  prometheusBuckets: optionalPrometheusBuckets,
  logger: optionalLogger,
  errorLogLevel: optionalErrorLogLevel,
}: Partial<GlobalOptions>) => {
  if (optionalLogger) {
    logger = optionalLogger;
  }

  if (optionalPrometheusBuckets) {
    prometheusBuckets = optionalPrometheusBuckets;
  }

  if (typeof optionalLogExecutionStart !== 'undefined') {
    logExecutionStart = optionalLogExecutionStart;
  }

  if (typeof optionalLogResult !== 'undefined') {
    logResult = optionalLogResult;
  }

  if (optionalParseError) {
    parseError = optionalParseError;
  }

  if (optionalErrorLogLevel) {
    errorLogLevel = optionalErrorLogLevel;
  }
};
