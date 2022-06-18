import is from '@sindresorhus/is';
import {
  logger,
  logResult as globalLogResult,
  logExecutionStart as globalLogExecutionStart,
  parseError as globalParseError,
} from './globalOptions.js';
import { createCounter, createHistogram } from './prometheus.js';
import { getGlobalContext } from './globalContext.js';
import safe from './safe.js';
import type { MonitorOptions, InitOptions, Monitor } from './types';

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

  const logExecutionStart = options?.logExecutionStart ?? globalLogExecutionStart;
  const logResult = options?.logResult ?? globalLogResult;
  const parseError = options?.parseError ?? globalParseError;

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
        extra: { context: { ...getGlobalContext?.(), ...options?.context }, error: safe(parseError)(error) },
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
