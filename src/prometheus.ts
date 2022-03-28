import { Counter, Histogram } from 'prom-client';

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

export const success = (
  method: string,
  stopTimer: () => number,
  counter: Counter<string>,
  histogram: Histogram<string>,
): Record<string, any> => {
  const executionTime = stopTimer();

  counter.inc({ method, result: 'success' });
  histogram.observe({ method, result: 'success' }, executionTime);

  return { executionTime };
};
export const error = (method: string, counter: Counter<string>): Record<string, any> => {
  counter.inc({ method, result: 'error' });

  return {};
};

export const init = (metric: string) => {
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

  return { success: (method: string) => success(method, stopTimer, counter, histogram), error: (method: string) => error(method, counter) };
};
