export interface MonitorOptions<T, TError> {
  context?: Record<string, any>;
  logExecutionStart?: boolean;
  parseResult?: (r: Unpromisify<T>) => any;
  parseError?: (e: TError) => any;
}

export interface InitOptions<TError> {
  scope: string;
  options?: {
    parseError?: (e: TError) => any;
  };
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

export interface MonitorArgs<T, TError> {
  scope?: string;
  method: string;
  callable: () => T;
  options?: MonitorOptions<T, TError>;
}
