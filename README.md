<div align="center">

# monitor

## Monitor your methods easily with Prometheus

</div>

## Install
```
yarn add @osskit/monitor
```

## Usage
## Scoped
```
import {createMonitor} from '@osskit/monitor'

export const monitor = createMonitor({scope: 'metrics'});

const result = await monitor('query', async () => db.query());
```
## Unscoped
```
import monitor from '@osskit/monitor'

const result = await monitor('query', async () => db.query());
```
## With Options
```
import {createMonitor} from '@osskit/monitor'

export const monitor = createMonitor({scope: 'metrics'});

// Context
const result = (id: string) => await monitor('query', async () => db.query(id), {context: {id});

// Parse Results
const logResults = (id: string) => await monitor('query', async () => db.query(id), {logResult: true, parseResult: (res) => res.prop});

// Parse Error
const errored = (id: string) => await monitor('query', async () => db.query(id), {logResult: true, parseError: (e) => e.statusCode});
```

## API

### createMonitor({scope?: string, options?: MonitorOptions})
#### scope
Type: `string`

Default: `general`

The scope of the application's metrics

Returns: `(method: string, callable: () => T, options?: MonitorOptions)`

#### MonitorOptions
Type: `{ context: Record<string, any>, logResult: boolean, parseResult: (value: T) => any; parseError: (error: T) => any }`
