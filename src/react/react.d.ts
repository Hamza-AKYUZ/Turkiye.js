// Derleme için React'in kullanılan bölümünün tip tanımı. Pakete girmez;
// paketi kullanan projede React'in kendi tipleri geçerlidir.
declare module "react" {
  export function useState<S>(initial: S | (() => S)): [S, (value: S) => void];
  export function useRef<T>(initial: T): { current: T };
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: readonly unknown[]): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
}
