export interface RenderResult<T> {
  readonly result: T;
  readonly renders: number;
  rerender(callback?: () => T): void;
}

export function renderHook<T>(callback: () => T): RenderResult<T>;
