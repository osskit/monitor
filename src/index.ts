import { Counter, Histogram, Registry } from 'prom-client';
import type { Unpromisify, MonitorOptions } from './types';
import logger from './logger';

const histograms: Record<string, Histogram<string>> = {};

const counters: Record<string, Counter<string>> = {};

const createHistogram = ({
  name,
  help,
  registry,
  labelNames,
}: {
  name: string;
  help: string;
  registry: Registry;
  labelNames?: string[];
}) => {
  if (histograms[name]) return histograms[name];

  const histogram = new Histogram({ name, help, buckets: [0.25, 0.5, 0.9, 0.99], labelNames, registers: [registry] });

  histograms[name] = histogram;
  registry.registerMetric(histogram);

  return histogram;
};

const createCounter = ({
  name,
  help,
  registry,
  labelNames,
}: {
  name: string;
  help: string;
  registry: Registry;
  labelNames?: string[];
}) => {
  if (counters[name]) return counters[name];

  const counter = new Counter({ name, help, labelNames, registers: [registry] });

  counters[name] = counter;
  registry.registerMetric(counter);

  return counter;
};

const monitor = <T>(scope: string, method: string, callable: () => T, registry: Registry, options?: MonitorOptions) => {
  const counter = createCounter({
    name: `${scope}_count`,
    help: `${scope}_count`,
    registry,
    labelNames: ['method', 'result'],
  });
  const histogram = createHistogram({
    name: `${scope}_execution_time`,
    help: `${scope}_execution_time`,
    labelNames: ['method', 'result'],
    registry,
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

export default (scope = 'monitor', registry: Registry) =>
  <T>(method: string, callable: () => T, options?: MonitorOptions) =>
    monitor(scope, method, callable, registry, options);
