export interface MonitorOptions<T, TError> {
  context?: Record<string, any>;
  logExecutionStart?: boolean;
  logResult?: boolean;
  parseResult?: (r: Unpromisify<T>) => any;
  parseError?: (e: TError) => any;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;
