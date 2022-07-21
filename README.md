<p align="center">
  <img width="250" height="250" src="https://user-images.githubusercontent.com/15312980/174908438-b6f5eaea-7b81-4008-9cad-8a7c2a45bbaf.svg">
</p>

<div align="center">
 
  ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/osskit/monitor/bump) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/osskit/monitor/blob/master/LICENSE.md) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
  
 Utilize a declarative API to wrap your functions to capture Prometheus metrics & logs for each function
</div>

## Install
```sh
yarn add @osskit/monitor
```
## Usage
### Scoped
```ts
import { createMonitor } from '@osskit/monitor'

export const monitor = createMonitor({ scope: 'metrics' });

const result1 = await monitor('query', async () => db.query());
const result2 = await monitor('update', async () => db.update());

// `metrics.query`, `metrics.update` for logs & metrics
```
### Unscoped
```ts
import monitor from '@osskit/monitor'

const result = await monitor('query', async () => db.query());

// `query` for logs & metrics
```
### With monitor options
```ts
import { createMonitor } from '@osskit/monitor'

export const monitor = createMonitor({ scope: 'metrics' });

// Context
const result = (id: string) => await monitor('query', async () => db.query(id), { context: { id } });

// Parse & Log Results
const logResults = (id: string) => await monitor('query', async () => db.query(id), { logResult: true, parseResult: (res) => res.prop });

// Parse Error
const errored = (id: string) => await monitor('query', async () => db.query(id), { logResult: true, parseError: (e) => e.statusCode });

// Log Execution Start
const executionStart = (id: string) => await monitor('query', async () => db.query(id), { logExecutionStart: true });
```

### With global options
```ts
import { setGlobalOptions, setGlobalContext } from '@osskit/monitor';
import  logger from './logger.js';

setGlobalOptions({
  context: { globalContextId: 'bla' },
  logResult: true,
  logExecutionStart: false,
  parseError: (res) => console.log(res),
  prometheusBuckets: [0.0001, 0.1, 0.5, 10],
  logger,
});

setGlobalContext(() => getDynamicContext());
```

## API
### createMonitor({ scope: string, options?: MonitorOptions })
#### scope
Type: `string`

The scope of the monitor's metrics

Will be used as the Prometheus metric name

Returns an instance of a function that calls `monitor` - `<T>(method: string, callable: () => T, options?: MonitorOptions<T>)`

### monitor(method: string, callable: () => T, options?: MonitorOptions)
#### method
Type: `string`

Will be used for the `method` label of the metric, or the metric name if no parent scope was declared

### setGlobalOptions({ options: MonitorGlobalOptions })
Set a number of options that will be used globally for all monitor invocations

### setGlobalContext(value: () => Record<string, string>)
Invoke a function that returns a global context to use in all monitor invocation logs

### Parameters

#### MonitorOptions

|            Parameter            | Description                                                    |
|:-------------------------------:|----------------------------------------------------------------|
|       `context?: boolean`       | add context that will be logged in all method's logs           | 
|      `logResult?: boolean`      | log the method's result                                        | 
|  `logExecutionStart?: boolean`  | log the start of the method's execution `method.start`         |
| `parseResult?: (e: any) => any` | transform the method's result that will be returned            |
| `parseError?: (e: any) => any`  | if the method errored, transform the error that will be thrown |

#### GlobalOptions
  
|           Parameter            | Description                                                                 |
|:------------------------------:|-----------------------------------------------------------------------------|
|     `logResult?: boolean`      | log the monitored methods results                                           | 
| `logExecutionStart?: boolean`  | log the start of the method's execution `method.start`                      |
| `parseError?: (e: any) => any` | if the method errored, transform the error that will be thrown              |
| `prometheusBuckets?: number[]` | use the following prometheus bucket list for monitor metrics across methods |
|     `logger?: BaseLogger`      | supply a `pino` `BaseLogger` for monitor to use in logging results          |
  
## License
[MIT License](LICENSE)
