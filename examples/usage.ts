import { createMonitor, unscoped as monitori } from '../src/index';

const monitor = createMonitor({ scope: 'process' });

monitori('some_method', () => {
  return true;
});

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
}).then((result) => console.log('hi 1111111!!!! ' + result));

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

monitor(
  'method_that_log_result',
  () => {
    return { foo: 'bar', baz: 1 };
  },
  { logResult: true },
);

monitor(
  'method_that_log_and_parse_result',
  () => {
    return { foo: 'bar', baz: 1 };
  },
  { logResult: true, parseResult: (x) => x.baz },
);

monitor(
  'async_method_that_log_and_parse_result',
  () => {
    return Promise.resolve({ foo: 'bar', baz: 1 });
  },
  { logResult: true, parseResult: (x) => x.baz },
).then((result) => console.log(`hi 222222!!!! ${result.baz}`));

try {
  monitor(
    'method_that_throws_error_and_parse_it',
    () => {
      throw new Error('error');
    },
    { parseError: (e: Error) => e.name },
  );
} catch {}

monitor(
  'async_method_that_throws_error_and_parse_it',
  async () => {
    await Promise.resolve();
    throw new Error('error');
  },
  { parseError: (e: Error) => e.stack },
).catch(() => {});

monitor(
  'method_that_returns_rejected_promise_and_parse_it',
  () => {
    return Promise.reject('foo');
  },
  { parseError: (err: string) => `this is error for ${err}` },
).catch(() => {});

monitor(
  'method_that_returns_rejected_promise_and_parse_it',
  () => {
    return Promise.reject('foo');
  },
  { parseError: (_err: string) => Promise.resolve('hi') },
).catch(() => {});

monitor(
  'parse_result_promise_within_a_resolved_promise',
  () => {
    return Promise.resolve({ foo: Promise.resolve('foo!!!!') });
  },
  { logResult: true, parseResult: (x) => x.foo },
);

monitor(
  'parse_result_promise_within_a_rejected_promise',
  () => {
    return Promise.resolve({ foo: Promise.reject('foo!!!!') });
  },
  { logResult: true, parseResult: (x) => x.foo },
);

monitor(
  'log_execution_start',
  () => {
    return 5;
  },
  { logExecutionStart: true },
);
