import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createMask, type Mask, type MaskKind, type MaskState, type MoneyMaskOptions } from "../mask/index.ts";

/** `useMask` ile bağlanabilecek input. Tarayıcıdaki `HTMLInputElement` bu arayüze uyar. */
export interface MaskInputElement {
  readonly selectionStart: number | null;
  setSelectionRange(start: number, end: number): void;
}

/** `onChange` olayının kullanılan bölümü. React'in `ChangeEvent` nesnesi bu arayüze uyar. */
export interface MaskChangeEvent {
  readonly target: { readonly value: string; readonly selectionStart: number | null };
}

export interface UseMaskOptions extends MoneyMaskOptions {
  /** İlk değer. Sunucuda ve tarayıcıda aynı sonucu verir. */
  readonly initialValue?: string;
}

export interface UseMaskResult {
  /** Input'a doğrudan verilecek özellikler: `<input {...mask.inputProps} />` */
  readonly inputProps: {
    readonly value: string;
    readonly onChange: (event: MaskChangeEvent) => void;
    readonly ref: (element: MaskInputElement | null) => void;
  };
  /** Formatlı değer. */
  readonly value: string;
  /** Maskenin son durumu: temiz değer, imleç ve tamamlanma bilgisi. */
  readonly state: MaskState;
  /** Değeri koddan değiştirir (ör. formu doldururken). */
  readonly setValue: (text: string) => void;
  /** Değeri temizler. */
  readonly reset: () => void;
}

// Sunucuda useLayoutEffect uyarı verdiği için orada useEffect kullanılır.
const useIsomorphicLayoutEffect =
  typeof (globalThis as { document?: unknown }).document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Maskeyi bir input'a bağlar; imleç konumunu korur.
 *
 * `kind` bir tür adı ya da `Mask` nesnesi olabilir. Tür adı değişirse maske
 * yeniden oluşturulur. `Mask` nesnesi ve seçenekler yalnız ilk render'da
 * alınır; her render'da yeni nesne verilmesi sorun yaratmaz.
 *
 * @example
 * function IbanInput() {
 *   const iban = useMask("iban");
 *   return <input {...iban.inputProps} aria-invalid={!iban.state.complete} />;
 * }
 */
export function useMask(kind: MaskKind | Mask, options?: UseMaskOptions): UseMaskResult {
  const holder = useRef<{ kind: MaskKind | Mask; mask: Mask } | null>(null);
  const element = useRef<MaskInputElement | null>(null);
  const pendingCursor = useRef<number | null>(null);

  const kindChanged = holder.current !== null && typeof kind === "string" && holder.current.kind !== kind;
  if (holder.current === null || kindChanged) {
    holder.current = { kind, mask: typeof kind === "string" ? createMask(kind, options) : kind };
  }
  const mask = holder.current.mask;

  const [state, setState] = useState<MaskState>(() => mask.input(options?.initialValue ?? ""));
  if (kindChanged) {
    // Tür değiştiğinde mevcut metin yeni maskeye göre yeniden yazılır.
    setState(mask.input(state.value));
  }

  const onChange = useCallback((event: MaskChangeEvent) => {
    const target = event.target;
    const next = (holder.current as { mask: Mask }).mask.input(target.value, target.selectionStart);
    pendingCursor.current = next.cursor;
    setState(next);
  }, []);

  const ref = useCallback((node: MaskInputElement | null) => {
    element.current = node;
  }, []);

  const setValue = useCallback((text: string) => {
    pendingCursor.current = null;
    setState((holder.current as { mask: Mask }).mask.input(text));
  }, []);

  const reset = useCallback(() => {
    pendingCursor.current = null;
    setState((holder.current as { mask: Mask }).mask.reset());
  }, []);

  // Formatlanan değer yazıldıktan sonra imleç yeni konumuna taşınır.
  useIsomorphicLayoutEffect(() => {
    const cursor = pendingCursor.current;
    const node = element.current;
    if (cursor === null || node === null) return;
    pendingCursor.current = null;
    try {
      node.setSelectionRange(cursor, cursor);
    } catch {
      // Bazı input türleri (ör. "number", "email") imleç konumunu desteklemez.
    }
  }, [state]);

  return {
    inputProps: { value: state.value, onChange, ref },
    value: state.value,
    state,
    setValue,
    reset,
  };
}
