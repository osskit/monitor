import is from '@sindresorhus/is';
import { global } from './globalOptions.js';
import { createCounter, createHistogram } from './prometheus.js';
import safe from './safe.js';
import type { MonitorOptions, InitOptions, Monitor } from './types';

let getGlobalContext: () => Record<string, string> | undefined;

export const setGlobalContext = (value: () => Record<string, string>) => {
  getGlobalContext = value;
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

  try {
    if (logExecutionStart) {
      global.logger.info(
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
      global.logger.info(
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
        global.logger.info(
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
        global.logger.info(
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
    global.logger.info(
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
