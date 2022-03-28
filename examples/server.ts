import express, { Response } from 'express';
import promBundle from 'express-prom-bundle';
import { createServer } from 'http';

import { createMonitor, setGlobalOptions } from '../src/index';
import { init } from '../src/prometheus';

setGlobalOptions({ metrics: init });
const monitor = createMonitor({ scope: 'process' });

const app = express()
  .use(
    promBundle({
      includeMethod: true,
      includePath: true,
    }) as any,
  )
  .post('/', function (_req, res: Response) {
    monitor('someMethod', () => {
      return 42;
    });
    res.sendStatus(204);
  });

createServer(app).listen(3000);
