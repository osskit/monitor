import { register } from 'prom-client';
import type { BaseLogger } from 'pino';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from '@jest/globals';
import { monitor, createMonitor, setGlobalOptions } from '../src/index.js';

describe('monitor', () => {
  describe('exports', () => {
    it('should expose a monitor function', () => {
      expect(typeof monitor).toBe('function');
    });

    it('should expose a createMonitor function', () => {
      expect(typeof createMonitor).toBe('function');
    });
  });

  describe('unscoped', () => {
    it('should return an inner value', () => {
      expect(monitor('name', () => 5)).toBe(5);
    });
  });

  describe('scoped', () => {
    beforeEach(() => {
      register.resetMetrics();
    });

    it('should return an inner value', () => {
      const scoped = createMonitor({ scope: 'scope' });

      expect(scoped('name', () => 5)).toBe(5);
    });

    it('should handle async functions', async () => {
      const scoped = createMonitor({ scope: 'scope' });

      await expect(scoped('name', async () => 5)).resolves.toBe(5);
    });

    it('should create metrics', async () => {
      const scoped = createMonitor({ scope: 'scope' });

      expect(scoped('metrics', () => 5)).toBe(5);

      const metrics = await register.getMetricsAsArray();

      expect(metrics).toHaveLength(4);
      expect(metrics[0]).toMatchObject({ name: 'name_count' });
      expect(metrics[1]).toMatchObject({ name: 'name_execution_time' });
      expect(metrics[2]).toMatchObject({ name: 'scope_count' });
      expect(metrics[3]).toMatchObject({ name: 'scope_execution_time' });
      expect(metrics[2]).toHaveProperty('hashMap.method:metrics,result:success.value', 1);
    });

    it('should write logs', () => {
      const logger: BaseLogger = {
        level: 'info',
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
        silent: jest.fn(),
        trace: jest.fn(),
        warn: jest.fn(),
      };

      setGlobalOptions({ logger });

      const scoped = createMonitor({ scope: 'scope' });

      expect(scoped('logs', () => 5)).toBe(5);

      expect(logger.info).toHaveBeenCalledWith(
        { extra: { context: {}, executionResult: 'NOT_LOGGED', executionTime: expect.any(Number) } },
        'scope.logs.success',
      );
    });

    it('should write logs with context', () => {
      const logger: BaseLogger = {
        level: 'info',
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
        silent: jest.fn(),
        trace: jest.fn(),
        warn: jest.fn(),
      };

      setGlobalOptions({ logger });

      const scoped = createMonitor({ scope: 'scope' });

      expect(scoped('logs', () => 5, { context: { a: true } })).toBe(5);

      expect(logger.info).toHaveBeenCalledWith(
        { extra: { context: { a: true }, executionResult: 'NOT_LOGGED', executionTime: expect.any(Number) } },
        'scope.logs.success',
      );
    });
  });
});
