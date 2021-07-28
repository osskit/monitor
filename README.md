<div align="center">

# monitor

## Monitor your actions the easy way with Prometheus

</div>

## Install
```
yarn add @osskit/monitor
```

## Usage
```
// initMonitor.ts

import monitor as createMonitor from '@osskit/monitor'

export const monitor = createMonitor();
```

```
// app.ts

import monitor from './initMonitor'

const result = await monitor('query', async () => db.query());
```

## API

### monitor(scope)
#### scope
Type: `string`

The scope of the application's metrics

Returns: `(method: string, callable: () => T, options?)`
#### options
Type: `{ context: Record<string, any> }`