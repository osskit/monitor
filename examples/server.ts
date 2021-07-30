import express, { Response } from 'express';
import promBundle from 'express-prom-bundle';
import { register } from 'prom-client';
import createMonitor from '../src/index';
import { createServer } from 'http';

const monitor = createMonitor();

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
  })
  .get('/', async function (_req, res: Response) {
    res.send(await register.metrics());
  });

createServer(app).listen(3000);
