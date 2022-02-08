import pino from 'pino';

const logger = pino({ level: 'debug', messageKey: 'message' });

export default logger;
