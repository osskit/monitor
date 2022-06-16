import { BaseLogger } from 'pino';

export interface GlobalOptions extends MonitorOptionsBase {
  prometheusBuckets?: number[];
  logger?: BaseLogger;
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
}

export interface MonitorOptions<T> extends MonitorOptionsBase {
  parseResult?: (r: Unpromisify<T>) => any;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

export interface Monitor<T> {
  scope?: string;
  method: string;
  callable: () => T;
  options?: MonitorOptions<T>;
}
