import pino from 'pino';

const transport = pino.transport({
  target: 'pino/file',
});
const logger = pino(transport);

export default logger;
