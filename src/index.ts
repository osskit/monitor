import { Counter, Histogram } from 'prom-client';
import type { Unpromisify, MonitorOptions } from './types';
import logger from './logger';

const histograms: Record<string, Histogram<string>> = {};

const counters: Record<string, Counter<string>> = {};

const createHistogram = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (histograms[name]) return histograms[name];

  const histogram = new Histogram({ name, help, buckets: [0.25, 0.5, 0.9, 0.99], labelNames });

  histograms[name] = histogram;

  return histogram;
};

const createCounter = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (counters[name]) return counters[name];

  const counter = new Counter({ name, help, labelNames });

  counters[name] = counter;

  return counter;
};

const monitor = <T>(scope: string, method: string, callable: () => T, options?: MonitorOptions) => {
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
    const result = callable();

    if (!(result instanceof Promise)) {
      const executionTime = stopTimer();

      counter.inc({ method, result: 'success' });
      histogram.observe({ method, result: 'success' }, executionTime);
      logger.info({ extra: { context: options?.context, executionTime } }, `${scope}.${method}.success`);

      return result;
    }

    return result
      .then((promiseResult: Unpromisify<T>) => {
        const executionTime = stopTimer();

        counter.inc({ method, result: 'success' });
        histogram.observe({ method, result: 'success' }, executionTime);
        logger.info({ extra: { context: options?.context, executionTime } }, `${scope}.${method}.success`);

        return promiseResult;
      })
      .catch((error: Error) => {
        counter.inc({ method, result: 'error' });
        logger.info({ extra: { context: options?.context } }, `${scope}.${method}.error`);
        throw error;
      }) as any as T;
  } catch (error) {
    counter.inc({ method, result: 'error' });
    logger.info({ extra: { context: options?.context } }, `${scope}.${method}.error`);
    throw error;
  }
};

export default (scope = 'monitor') =>
  <T>(method: string, callable: () => T, options?: MonitorOptions) =>
    monitor(scope, method, callable, options);
