import { Counter, Histogram } from 'prom-client';
import is from '@sindresorhus/is';
import defaultLogger from './logger.js';
import safe from './safe.js';

import type { MonitorOptions, InitOptions, Monitor } from './types';
import type { GlobalOptions } from '.';

const histograms: Record<string, Histogram<string>> = {};

const counters: Record<string, Counter<string>> = {};

const global: GlobalOptions = {
  logExecutionStart: false,
  logResult: false,
  parseError: (e: any) => e,
  logger: defaultLogger,
};

let getGlobalContext: () => Record<string, string> | undefined;

const createHistogram = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (histograms[name]) return histograms[name];

  const histogram = new Histogram({
    name,
    help,
    buckets: global.prometheusBuckets?.length ? global.prometheusBuckets : [0.003, 0.03, 0.1, 0.3, 1.5, 10],
    labelNames,
  });

  histograms[name] = histogram;

  return histogram;
};

const createCounter = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (counters[name]) return counters[name];

  const counter = new Counter({ name, help, labelNames });

  counters[name] = counter;

  return counter;
};

export const setGlobalContext = (value: () => Record<string, string>) => {
  getGlobalContext = value;
};

export const setGlobalOptions = ({ logExecutionStart, logResult, parseError, prometheusBuckets, logger }: GlobalOptions) => {
  global.logExecutionStart = logExecutionStart;
  global.logResult = logResult;
  global.parseError = parseError;
  global.prometheusBuckets = prometheusBuckets;
  global.logger = logger;
};

const monitor = <T>({ scope: monitorScope, method, callable, options }: Monitor<T>) => {
  const metric = monitorScope ?? method;
  const scope = monitorScope ? `${monitorScope}.${method}` : method;

  const counter = createCounter({
    name: `${metric}_count`,
    help: `${metric}_count`,
    labelNames: ['method', 'result'],
  });
  const histogram = createHistogram({
    name: `${metric}_execution_time`,
    help: `${metric}_execution_time`,
    labelNames: ['method', 'result'],
  });

  const stopTimer = histogram.startTimer();

  const logExecutionStart = options?.logExecutionStart ?? global.logExecutionStart;
  const logResult = options?.logResult ?? global.logResult;
  const parseError = options?.parseError ?? global.parseError;
  const logger = global.logger ?? defaultLogger;

  try {
    if (logExecutionStart) {
      logger.info(
        {
          extra: {
            context: { ...getGlobalContext?.(), ...options?.context },
          },
        },
        `${scope}.start`,
      );
    }
    const result = callable();

    if (!is.promise(result)) {
      const executionTime = stopTimer();

      counter.inc({ method, result: 'success' });
      histogram.observe({ method, result: 'success' }, executionTime);
      logger.info(
        {
          extra: {
            context: { ...getGlobalContext?.(), ...options?.context },
            executionTime,
            executionResult: logResult ? safe(options?.parseResult)(result) : 'NOT_LOGGED',
          },
        },
        `${scope}.success`,
      );

      return result;
    }

    return result
      .then(async (promiseResult) => {
        const executionTime = stopTimer();

        counter.inc({ method, result: 'success' });
        histogram.observe({ method, result: 'success' }, executionTime);
        logger.info(
          {
            extra: {
              context: { ...getGlobalContext?.(), ...options?.context },
              executionTime,
              executionResult: logResult ? await safe(options?.parseResult)(promiseResult) : 'NOT_LOGGED',
            },
          },
          `${scope}.success`,
        );

        return promiseResult;
      })
      .catch(async (error: Error) => {
        counter.inc({ method, result: 'error' });
        logger.info(
          {
            extra: {
              context: { ...getGlobalContext?.(), ...options?.context },
              error: await safe(parseError)(error),
            },
          },
          `${scope}.error`,
        );
        throw error;
      }) as any as T;
  } catch (error) {
    counter.inc({ method, result: 'error' });
    logger.info(
      {
        extra: { context: { ...getGlobalContext?.(), ...options?.context }, error: safe(global.parseError)(error) },
      },
      `${scope}.error`,
    );
    throw error;
  }
};

export const createMonitor =
  ({ scope, ...initOptions }: InitOptions) =>
  <T>(method: string, callable: () => T, options?: MonitorOptions<T>) =>
    monitor({ scope, method, callable, options: { ...initOptions.options, ...options } });

export default <T>(method: string, callable: () => T, options?: MonitorOptions<T>) => monitor({ method, callable, options });
