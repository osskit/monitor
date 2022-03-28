import logger from './logger';
import safe from './safe';

import type { Unpromisify, MonitorOptions, InitOptions, Monitor } from './types';
import type { GlobalOptions } from '.';

const defaultMetrics = (_: string) => ({ success: (_: string) => ({}), error: (_: string) => ({}) });
const global: GlobalOptions = {
  logExecutionStart: false,
  logResult: false,
  parseError: (e: any) => e,
  metrics: defaultMetrics,
};

let getGlobalContext: () => Record<string, string> | undefined;

export const setGlobalContext = (value: () => Record<string, string>) => {
  getGlobalContext = value;
};

export const setGlobalOptions = ({ logExecutionStart, logResult, parseError, metrics }: GlobalOptions) => {
  global.logExecutionStart = logExecutionStart;
  global.logResult = logResult;
  global.parseError = parseError;
  global.metrics = metrics;
};

const monitor = <T>({ scope: monitorScope, method, callable, options }: Monitor<T>) => {
  const metric = monitorScope ?? method;
  const scope = monitorScope ? `${monitorScope}.${method}` : method;

  const { success, error: errorMetrics } = options?.metrics?.(metric) ?? global.metrics?.(metric) ?? defaultMetrics(metric);
  const logExecutionStart = options?.logExecutionStart ?? global.logExecutionStart;
  const logResult = options?.logResult ?? global.logResult;
  const parseError = options?.parseError ?? global.parseError;

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

    if (!(result instanceof Promise)) {
      const metadata = success(method);

      logger.info(
        {
          extra: {
            context: { ...getGlobalContext?.(), ...options?.context },
            ...metadata,
            executionResult: logResult ? safe(options?.parseResult)(result) : 'NOT_LOGGED',
          },
        },
        `${scope}.success`,
      );

      return result;
    }

    return result
      .then(async (promiseResult: Unpromisify<T>) => {
        const metadata = success(method);

        logger.info(
          {
            extra: {
              context: { ...getGlobalContext?.(), ...options?.context },
              ...metadata,
              executionResult: logResult ? await safe(options?.parseResult)(promiseResult) : 'NOT_LOGGED',
            },
          },
          `${scope}.success`,
        );

        return promiseResult;
      })
      .catch(async (error: Error) => {
        errorMetrics(method);
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
    errorMetrics(method);
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
