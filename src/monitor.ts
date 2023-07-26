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
import safe from './safe.js';
import type { MonitorOptions, InitOptions, Monitor } from './types.js';

const innerMonitor = <Callable>({ scope: monitorScope, method: monitorMethod, callable, options }: Monitor<Callable>) => {
  const method = monitorMethod.replaceAll('-', '_');
  const sanitizedScope = monitorScope?.replaceAll('-', '_');
  const metric = sanitizedScope ?? method;
  const scope = sanitizedScope ? `${sanitizedScope}.${method}` : method;

  const logExecutionStart = options?.logExecutionStart ?? globalLogExecutionStart;
  const logResult = options?.logResult ?? globalLogResult;
  const parseError = options?.parseError ?? globalParseError;
  const errorLogLevel = options?.errorLogLevel ?? globalErrorLogLevel;
  const labeling = options?.labeling ?? [];

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

  const labelCounters = labeling
    .filter(({ labelNames }) => !!labelNames?.length)
    .map(({ name, help, labelNames, contextKeys }) => {
      const sanitizedName = name.replaceAll('-', '_').replaceAll(' ', '_');
      const labelCounter = createCounter({
        name: `${metric}_${sanitizedName}_count`,
        help: help ?? `${metric} ${sanitizedName} count`,
        labelNames: ['method', 'result', ...(labelNames ?? [])],
      });

      return (result: string) => {
        const contextValues =
          contextKeys?.map((key) => options?.context?.[key]).filter((value): value is string => typeof value === 'string') ?? [];

        labelCounter.labels(method, result, ...contextValues).inc();
      };
    });

  const increaseLabelCounters = (result: string) => {
    labelCounters.forEach((labelCounter) => {
      labelCounter(result);
    });
  };

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
      counter.inc({ method, result: 'success' });
      increaseLabelCounters('success');
      histogram.observe({ method, result: 'success' }, executionTime);
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
        counter.inc({ method, result: 'success' });
        increaseLabelCounters('success');
        histogram.observe({ method, result: 'success' }, executionTime);

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
        counter.inc({ method, result: 'error' });
        increaseLabelCounters('error');

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
    counter.inc({ method, result: 'error' });
    increaseLabelCounters('error');

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
  ({ scope, ...initOptions }: InitOptions) =>
  <Callable>(method: string, callable: () => Callable, options?: MonitorOptions<Callable>) =>
    innerMonitor({ scope, method, callable, options: { ...initOptions.options, ...options } });

export const monitor = <Callable>(method: string, callable: () => Callable, options?: MonitorOptions<Callable>) =>
  innerMonitor({ method, callable, options });
