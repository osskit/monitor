import type { BaseLogger } from 'pino';
import type { CamelCase, PromiseValue } from 'type-fest';

export interface GlobalOptions extends MonitorOptionsBase {
  prometheusBuckets: number[];
  logger: BaseLogger;
}

export interface InitOptions<Scope extends string> {
  scope: CamelCase<Scope>;
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
  parseResult?: (r: PromiseValue<T>) => any;
}

export interface Monitor<Callable, Scope extends string, Method extends string> {
  scope?: CamelCase<Scope>;
  method: CamelCase<Method>;
  callable: () => Callable;
  options?: MonitorOptions<Callable>;
}
