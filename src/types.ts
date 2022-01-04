export interface MonitorOptions<T> {
  context?: Record<string, any>;
  logExecutionStart?: boolean;
  parseResult?: (r: Unpromisify<T>) => any;
  parseError?: (e: any) => any;
}

export interface InitOptions {
  scope: string;
  options?: {
    parseError?: (e: any) => any;
    logExecutionStart?: boolean;
  };
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

export interface Monitor<T> {
  scope?: string;
  method: string;
  callable: () => T;
  options?: MonitorOptions<T>;
}
