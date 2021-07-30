import createMonitor from '../src/index';

const monitor = createMonitor();

monitor('some_method', () => {
  return true;
});

monitor('void_method', () => {});

monitor('async_void_method', () => {
  return Promise.resolve();
});

monitor(
  'method_with_context',
  () => {
    return 54;
  },
  { context: { foo: 'bar' } },
);

monitor('async_method_with_string_return_value', () => {
  return Promise.resolve('foo');
});

monitor('method_with_object_return_type', () => {
  return {
    foo: 'bar',
    baz: 1,
  };
});

monitor('async_method_with_object_return_type', () => {
  return Promise.resolve({
    foo: 'bar',
    baz: 1,
  });
});

monitor('method_that_use_async_await', async () => {
  return await 5;
});

try {
  monitor('method_that_throws_error', () => {
    throw new Error('error');
  });
} catch {}

monitor('method_that_returns_rejected_promise', () => {
  return Promise.reject('foo');
}).catch(() => {});

monitor('method_that_throws_error_and_use_async_await', async () => {
  await Promise.resolve();
  throw new Error('error');
}).catch(() => {});
