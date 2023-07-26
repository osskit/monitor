import type { BaseLogger, Level } from 'pino';

export interface GlobalOptions extends MonitorOptionsBase {
  prometheusBuckets: number[];
  logger: BaseLogger;
}

export interface InitOptions {
  scope: string;
  options?: {
    parseError?: (e: any) => any;
  };
}

export interface MonitorOptionsBase {
  context?: Record<string, any>;
  logResult?: boolean;
  logExecutionStart?: boolean;
  parseError?: (e: any) => any;
  errorLogLevel?: Level;
}

export interface MonitorOptions<T> extends MonitorOptionsBase {
  parseResult?: (r: Awaited<T>) => any;
  labeling?: ContextLabeling[];
}

export interface ContextLabeling {
  name: string;
  help?: string;
  labelNames?: string[];
  contextKeys?: string[];
}

export interface Monitor<Callable> {
  scope?: string;
  method: string;
  callable: () => Callable;
  options?: MonitorOptions<Callable>;
}
