export interface MonitorOptions {
    context?: Record<string, any>;
    logResult?: boolean;
    parseResult?: <T>(r: Unpromisify<T>) => any;
}

export type Unpromisify<T> = T extends PromiseLike<infer U> ? U : T;
