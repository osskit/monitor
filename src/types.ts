export interface MonitorOptions<T> {
    context?: Record<string, any>;
    logResult?: boolean;
    parseResult?: (r: Unpromisify<T>) => any;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;
