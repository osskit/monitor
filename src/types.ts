export interface MonitorOptions {
  context?: Record<string, any>;
  labelNames?: string[];
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;
