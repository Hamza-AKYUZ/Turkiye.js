// Hook testleri için React'in küçük bir taklidi: tek bileşen, senkron render.
let current = null;

function changed(previous, next) {
  if (previous === undefined || next === undefined) return true;
  return previous.length !== next.length || previous.some((value, index) => !Object.is(value, next[index]));
}

function slot(init) {
  const instance = current;
  const index = instance.index++;
  if (!(index in instance.slots)) instance.slots[index] = init();
  return instance.slots[index];
}

export function renderHook(callback) {
  const instance = { slots: [], index: 0, result: undefined, dirty: false, effects: [], renders: 0, render: null };
  instance.render = () => {
    let passes = 0;
    do {
      if (++passes > 25) throw new Error("Sonsuz render döngüsü");
      instance.dirty = false;
      instance.index = 0;
      current = instance;
      try {
        instance.result = callback();
      } finally {
        current = null;
      }
      instance.renders++;
    } while (instance.dirty);
    for (const effect of instance.effects.splice(0)) effect();
  };
  instance.render();
  return {
    get result() {
      return instance.result;
    },
    get renders() {
      return instance.renders;
    },
    rerender(next) {
      if (next) callback = next;
      instance.render();
    },
  };
}

export function useState(initial) {
  const instance = current;
  const state = slot(() => {
    const holder = { value: typeof initial === "function" ? initial() : initial };
    holder.set = (next) => {
      const value = typeof next === "function" ? next(holder.value) : next;
      if (Object.is(value, holder.value)) return;
      holder.value = value;
      if (current === instance) instance.dirty = true;
      else instance.render();
    };
    return holder;
  });
  return [state.value, state.set];
}

export function useRef(initial) {
  return slot(() => ({ current: initial }));
}

export function useCallback(callback, deps) {
  const state = slot(() => ({ callback, deps }));
  if (changed(state.deps, deps)) {
    state.callback = callback;
    state.deps = deps;
  }
  return state.callback;
}

export function useEffect(effect, deps) {
  const instance = current;
  const state = slot(() => ({ deps: undefined, cleanup: undefined, ran: false }));
  if (!state.ran || changed(state.deps, deps)) {
    state.ran = true;
    state.deps = deps;
    instance.effects.push(() => {
      if (typeof state.cleanup === "function") state.cleanup();
      state.cleanup = effect();
    });
  }
}

export const useLayoutEffect = useEffect;
