import is from '@sindresorhus/is';
import {
  logger,
  logResult as globalLogResult,
  logExecutionStart as globalLogExecutionStart,
  parseError as globalParseError,
  errorLogLevel as globalErrorLogLevel,
} from './globalOptions.js';
import { createCounter, createHistogram } from './prometheus.js';
import { getGlobalContext } from './globalContext.js';
import { safe } from './safe.js';
import type { MonitorOptions, InitOptions, Monitor } from './types.js';

const innerMonitor = <Callable>({ scope: monitorScope, method: monitorMethod, callable, labeling, options }: Monitor<Callable>) => {
  const method = monitorMethod.replaceAll('-', '_');
  const sanitizedScope = monitorScope?.replaceAll('-', '_');
  const metric = sanitizedScope ?? method;
  const scope = sanitizedScope ? `${sanitizedScope}.${method}` : method;

  const logExecutionStart = options?.logExecutionStart ?? globalLogExecutionStart;
  const logResult = options?.logResult ?? globalLogResult;
  const parseError = options?.parseError ?? globalParseError;
  const errorLogLevel = options?.errorLogLevel ?? globalErrorLogLevel;
  const labelingKeys = Object.keys(labeling ?? {});

  const counter = createCounter({
    name: `${metric}_count`,
    help: `${metric}_count`,
    labelNames: ['method', 'result', ...labelingKeys],
  });
  const histogram = createHistogram({
    name: `${metric}_execution_time`,
    help: `${metric}_execution_time`,
    labelNames: ['method', 'result', ...labelingKeys],
  });

  const stopTimer = histogram.startTimer();

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
      const parsedResult = safe(options?.parseResult)(result);
      counter.inc({ ...labeling, method, result: 'success' });
      histogram.observe({ ...labeling, method, result: 'success' }, executionTime);
      logger.info(
        {
          extra: {
            context: { ...getGlobalContext?.(), ...options?.context },
            executionTime,
            executionResult: logResult ? (is.object(parsedResult) ? parsedResult : { value: parsedResult }) : undefined,
          },
        },
        `${scope}.success`,
      );

      return result;
    }

    return result
      .then(async (promiseResult) => {
        const executionTime = stopTimer();
        const parsedResult = safe(options?.parseResult)(promiseResult);
        counter.inc({ ...labeling, method, result: 'success' });
        histogram.observe({ ...labeling, method, result: 'success' }, executionTime);

        logger.info(
          {
            extra: {
              context: { ...getGlobalContext?.(), ...options?.context },
              executionTime,
              executionResult: logResult ? (is.object(parsedResult) ? parsedResult : { value: parsedResult }) : undefined,
            },
          },
          `${scope}.success`,
        );

        return promiseResult;
      })
      .catch(async (error: Error) => {
        counter.inc({ ...labeling, method, result: 'error' });
        logger[errorLogLevel](
          {
            extra: {
              context: { ...getGlobalContext?.(), ...options?.context },
              error: await safe(parseError)(error),
            },
          },
          `${scope}.error`,
        );
        throw error;
      }) as any as Callable;
  } catch (error) {
    counter.inc({ ...labeling, method, result: 'error' });
    logger[errorLogLevel](
      {
        extra: { context: { ...getGlobalContext?.(), ...options?.context }, error: safe(parseError)(error) },
      },
      `${scope}.error`,
    );
    throw error;
  }
};

export const createMonitor =
  <LabelKeys extends readonly string[] = []>({ scope, ...initOptions }: InitOptions) =>
  <Result>(
    method: string,
    callable: () => Result,
    options?: MonitorOptions<Result> & (LabelKeys[number] extends never ? object : { labeling: Record<LabelKeys[number], string> }),
  ) =>
    innerMonitor({
      scope,
      method,
      callable,
      labeling: options && 'labeling' in options ? options.labeling : undefined,
      options: { ...initOptions.options, ...options },
    });

export const monitor = <Result>(
  method: string,
  callable: () => Result,
  options?: MonitorOptions<Result> & { labeling?: Record<string, string> },
) => innerMonitor({ method, callable, labeling: options?.labeling, options });
