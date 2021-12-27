export interface MonitorOptions<T, TError> {
  context?: Record<string, any>;
  logExecutionStart?: boolean;
  logResult?: boolean;
  parseResult?: (r: Unpromisify<T>) => any;
  parseError?: (e: TError) => any;
}

export interface InitOptions<T, TError> {
  scope?: string;
  options?: MonitorOptions<T, TError>;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

export interface MonitorArgs<T, TError> {
  scope?: string;
  method: string;
  callable: () => T;
  options?: MonitorOptions<T, TError>;
}
