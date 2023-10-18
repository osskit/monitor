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

export interface MonitorOptions<Result> extends MonitorOptionsBase {
  parseResult?: (result: Awaited<Result>) => any;
}

export interface Monitor<Result> {
  scope?: string;
  labeling?: Record<string, string>;
  method: string;
  callable: () => Result;
  options?: MonitorOptions<Result>;
}
