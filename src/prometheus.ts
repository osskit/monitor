import { Counter, Histogram } from 'prom-client';
import { prometheusBuckets } from './globalOptions.js';

const histograms: Record<string, Histogram> = {};

const counters: Record<string, Counter> = {};

export const createHistogram = ({ name, help, labelNames }: { name: string; help: string; labelNames?: string[] }) => {
  const existingHistograms = histograms[name];

  if (existingHistograms) {
    return existingHistograms;
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
  const existingCounter = counters[name];

  if (existingCounter) {
    return existingCounter;
  }

  const counter = new Counter({ name, help, labelNames });

  counters[name] = counter;

  return counter;
};
