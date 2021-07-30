import express, { Response } from 'express';
import promBundle from 'express-prom-bundle';
import { createServer } from 'http';

import createMonitor from '../src/index';

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
    });

createServer(app).listen(3000);
