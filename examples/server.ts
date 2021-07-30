import http from 'http';
import { register } from 'prom-client';

import createMonitor from '../src/index';

const monitor = createMonitor();

const server = http.createServer(async (req, res) => {
  if (req.method == 'POST') {
    monitor('someMethod', () => {
      return 42;
    });
  }
  if (req.method === 'GET') {
    res.end(await register.metrics());
  }
  res.end();
});
server.listen(3000);
