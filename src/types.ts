export interface GlobalOptions {
  logExecutionStart: boolean;
  logResult: boolean;
  parseError?: <T>(err: T) => any;
}

export interface InitOptions {
  scope: string;
  options?: {
    parseError?: (e: any) => any;
  };
}
export interface MonitorOptions<T> {
  context?: Record<string, any>;
  parseResult?: (r: Unpromisify<T>) => any;
  parseError?: (e: any) => any;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;

export interface Monitor<T> {
  scope?: string;
  method: string;
  callable: () => T;
  options?: MonitorOptions<T>;
}
