export interface MonitorOptions {
  context?: Record<string, any>;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;
