import { Counter, Histogram } from 'prom-client';
import { prometheusBuckets } from './globalOptions.js';

const histograms: Record<string, Histogram<string>> = {};

const counters: Record<string, Counter<string>> = {};

export const createHistogram = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (histograms[name]) {
    return histograms[name];
  }

  const histogram = new Histogram({
    name,
    help,
    buckets: prometheusBuckets,
    labelNames,
  });

  histograms[name] = histogram;

  return histogram;
};

export const createCounter = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  if (counters[name]) {
    return counters[name];
  }

  const counter = new Counter({ name, help, labelNames });

  counters[name] = counter;

  return counter;
};
