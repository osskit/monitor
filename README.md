<div align="center">

# monitor

## Monitor your methods easily with Prometheus

</div>

## Install
```
yarn add @osskit/monitor
```

## Usage
```
import createMonitor from '@osskit/monitor'

export const monitor = createMonitor('metrics');

const result = await monitor('query', async () => db.query());
```

## API

### monitor(scope)
#### scope
Type: `string`

Default: `general`

The scope of the application's metrics

Returns: `(method: string, callable: () => T, options?: MonitorOptions)`

#### options
Type: `{ context: Record<string, any> }`
