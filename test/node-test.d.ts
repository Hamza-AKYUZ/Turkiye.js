// Testlerde kullanılan node:test ve node:assert/strict API'lerinin tip tanımları.

declare module "node:test" {
  type TestFn = () => void | Promise<void>;
  export function describe(name: string, fn: TestFn): void;
  export function it(name: string, fn: TestFn): void;
  export function test(name: string, fn: TestFn): void;
  export function beforeEach(fn: TestFn): void;
  export function afterEach(fn: TestFn): void;
}

declare module "node:assert/strict" {
  type ErrorMatcher = RegExp | ((error: unknown) => boolean) | object | (new (...args: never[]) => unknown);

  interface Assert {
    (value: unknown, message?: string): asserts value;
    ok(value: unknown, message?: string): asserts value;
    equal<T>(actual: unknown, expected: T, message?: string): asserts actual is T;
    notEqual(actual: unknown, expected: unknown, message?: string): void;
    deepEqual<T>(actual: unknown, expected: T, message?: string): asserts actual is T;
    notDeepEqual(actual: unknown, expected: unknown, message?: string): void;
    match(value: string, pattern: RegExp, message?: string): void;
    throws(fn: () => unknown, expected?: ErrorMatcher, message?: string): void;
    doesNotThrow(fn: () => unknown, message?: string): void;
  }

  const assert: Assert;
  export default assert;
}
