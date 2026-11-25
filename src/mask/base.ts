import { toText } from "../core/input.ts";

/** Maskenin girdi sonrası durumu. */
export interface MaskState {
  /** Ayraçlarla yazılmış değer; input'a yazılacak metin. */
  readonly value: string;
  /** Ayraçsız temiz değer; kaydedilecek ya da doğrulanacak metin. */
  readonly raw: string;
  /** İmlecin `value` içindeki yeni konumu. */
  readonly cursor: number;
  /** Girdi tamamlandı ve geçerli mi. */
  readonly complete: boolean;
}

const EMPTY_STATE: MaskState = Object.freeze({ value: "", raw: "", cursor: 0, complete: false });

/**
 * Yazarken format uygulayan maskelerin ortak sınıfı. Her girdide temiz değer
 * yeniden hesaplanır ve imleç, önündeki anlamlı karakter sayısı korunarak
 * yeni konumuna taşınır. Bir ayraç silindiğinde ondan önceki karakter silinir.
 *
 * Yeni bir maske için `clean`, `render` ve `isComplete` yazılır.
 */
export abstract class Mask {
  private current: MaskState = EMPTY_STATE;

  /** Ayraç sayılan karakterler. Bu karakterler temiz değere girmez. */
  protected readonly separators: string = " ";

  /** Ham metinden temiz değeri çıkarır. Sonuç, metnin her ön ekinde tutarlı olmalıdır. */
  protected abstract clean(text: string): string;

  /** Temiz değeri ayraçlarla yazar. */
  protected abstract render(raw: string): string;

  /** Temiz değer tamamlanmış ve geçerli mi. */
  protected abstract isComplete(raw: string): boolean;

  /** Son girdiden sonraki durum. */
  get state(): MaskState {
    return this.current;
  }

  /**
   * Input'un yeni değerini işler.
   *
   * @param text Input'taki metin.
   * @param cursor Input'taki imleç konumu. Verilmezse metnin sonu kabul edilir.
   *
   * @example
   * const mask = new IbanMask();
   * mask.input("tr3300061");   // { value: "TR33 0006 1", raw: "TR3300061", cursor: 11, complete: false }
   */
  input(text: string, cursor?: number | null): MaskState {
    const source = toText(text);
    const position =
      typeof cursor === "number" && Number.isInteger(cursor) ? Math.min(Math.max(cursor, 0), source.length) : source.length;
    let raw = this.clean(source);
    let rawCursor = Math.min(this.clean(source.slice(0, position)).length, raw.length);

    const previous = this.current;
    const deletedSeparator =
      raw === previous.raw &&
      source.length === previous.value.length - 1 &&
      this.separators.includes(previous.value.charAt(position)) &&
      previous.value.charAt(position) !== "";
    if (deletedSeparator && rawCursor > 0) {
      raw = this.clean(raw.slice(0, rawCursor - 1) + raw.slice(rawCursor));
      rawCursor = Math.min(rawCursor - 1, raw.length);
    }

    const value = this.render(raw);
    this.current = Object.freeze({
      value,
      raw,
      cursor: this.cursorAt(value, rawCursor),
      complete: raw !== "" && this.isComplete(raw),
    });
    return this.current;
  }

  /** Durumu sıfırlar. */
  reset(): MaskState {
    this.current = EMPTY_STATE;
    return this.current;
  }

  /** `count` anlamlı karakterden sonraki konum. */
  private cursorAt(value: string, count: number): number {
    if (count <= 0) return 0;
    let seen = 0;
    for (let i = 0; i < value.length; i++) {
      if (!this.separators.includes(value.charAt(i))) seen++;
      if (seen === count) return i + 1;
    }
    return value.length;
  }
}

/**
 * `attachMask` ile kullanılabilecek input. Tarayıcıdaki `HTMLInputElement`
 * bu arayüze uyar.
 */
export interface MaskableElement {
  value: string;
  readonly selectionStart: number | null;
  setSelectionRange(start: number, end: number): void;
  addEventListener(type: "input", listener: () => void): void;
  removeEventListener(type: "input", listener: () => void): void;
}

/**
 * Maskeyi bir input'a bağlar; framework kullanmayan sayfalar içindir. Dönen
 * fonksiyon dinleyiciyi kaldırır; input sayfadan çıkarılmadan önce
 * çağrılmalıdır.
 *
 * @example
 * const detach = attachMask(document.querySelector("#iban"), new IbanMask());
 * // ...
 * detach();
 */
export function attachMask(element: MaskableElement, mask: Mask): () => void {
  const update = (moveCursor: boolean): void => {
    const state = mask.input(element.value, element.selectionStart);
    if (element.value !== state.value) element.value = state.value;
    if (!moveCursor) return;
    try {
      element.setSelectionRange(state.cursor, state.cursor);
    } catch {
      // Bazı input türleri (ör. "number", "email") imleç konumunu desteklemez.
    }
  };
  const listener = (): void => update(true);
  // Mevcut değer biçimlenir; odak değişmesin diye imleç taşınmaz.
  if (element.value !== "") update(false);
  element.addEventListener("input", listener);
  let attached = true;
  return () => {
    if (!attached) return;
    attached = false;
    element.removeEventListener("input", listener);
  };
}
