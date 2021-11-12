import { Counter, Histogram } from 'prom-client';
import logger from './logger';
import safe from './safe';

import type { Unpromisify, MonitorOptions } from './types';

const histograms: Record<string, Histogram<string>> = {};

const counters: Record<string, Counter<string>> = {};

const createHistogram = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (histograms[name]) return histograms[name];

  const histogram = new Histogram({ name, help, buckets: [0.003, 0.03, 0.1, 0.3, 1.5, 10], labelNames });

  histograms[name] = histogram;

  return histogram;
};

const createCounter = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (counters[name]) return counters[name];

  const counter = new Counter({ name, help, labelNames });

  counters[name] = counter;

  return counter;
};

const monitor = <T, TError>(scope: string, method: string, callable: () => T, options?: MonitorOptions<T, TError>) => {
  const counter = createCounter({
    name: `${scope}_count`,
    help: `${scope}_count`,
    labelNames: ['method', 'result'],
  });
  const histogram = createHistogram({
    name: `${scope}_execution_time`,
    help: `${scope}_execution_time`,
    labelNames: ['method', 'result'],
  });

  const stopTimer = histogram.startTimer();

  try {
    if (options?.logExecutionStart) {
      logger.info(
        {
          extra: {
            context: options?.context,
          },
        },
        `${scope}.${method}.start`,
      );
    }
    const result = callable();

    if (!(result instanceof Promise)) {
      const executionTime = stopTimer();

      counter.inc({ method, result: 'success' });
      histogram.observe({ method, result: 'success' }, executionTime);
      logger.info(
        {
          extra: {
            context: options?.context,
            executionTime,
            executionResult: options?.logResult ? safe(options?.parseResult)(result) : 'NOT_LOGGED',
          },
        },
        `${scope}.${method}.success`,
      );

      return result;
    }

    return result
      .then(async (promiseResult: Unpromisify<T>) => {
        const executionTime = stopTimer();

        counter.inc({ method, result: 'success' });
        histogram.observe({ method, result: 'success' }, executionTime);
        logger.info(
          {
            extra: {
              context: options?.context,
              executionTime,
              executionResult: options?.logResult ? await safe(options?.parseResult)(promiseResult) : 'NOT_LOGGED',
            },
          },
          `${scope}.${method}.success`,
        );

        return promiseResult;
      })
      .catch(async (error: Error) => {
        counter.inc({ method, result: 'error' });
        logger.info({ extra: { context: options?.context, error: await safe(options?.parseError)(error) } }, `${scope}.${method}.error`);
        throw error;
      }) as any as T;
  } catch (error) {
    counter.inc({ method, result: 'error' });
    logger.info({ extra: { context: options?.context, error: safe(options?.parseError)(error) } }, `${scope}.${method}.error`);
    throw error;
  }
};

export const createMonitor =
  (scope = 'monitor') =>
  <T, TError>(method: string, callable: () => T, options?: MonitorOptions<T, TError>) =>
    monitor(scope, method, callable, options);
