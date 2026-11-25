import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderHook } from "../../test/react/fake-react.mjs";
import { IbanMask, type MaskKind } from "../mask/index.ts";
import { type MaskInputElement, useMask } from "./index.ts";

function fakeElement() {
  const element = {
    selection: null as [number, number] | null,
    selectionStart: null as number | null,
    setSelectionRange(start: number, end: number) {
      element.selection = [start, end];
    },
  };
  return element;
}

describe("useMask", () => {
  it("ilk değeri biçimler", () => {
    const hook = renderHook(() => useMask("phone", { initialValue: "5321234567" }));
    assert.equal(hook.result.value, "0532 123 45 67");
    assert.equal(hook.result.inputProps.value, "0532 123 45 67");
    assert.equal(hook.result.state.complete, true);
  });

  it("onChange ile biçimler ve imleci taşır", () => {
    const hook = renderHook(() => useMask("iban"));
    const element = fakeElement();
    hook.result.inputProps.ref(element as MaskInputElement);
    hook.result.inputProps.onChange({ target: { value: "tr3300061", selectionStart: 9 } });
    assert.equal(hook.result.value, "TR33 0006 1");
    assert.deepEqual(element.selection, [11, 11]);
  });

  it("geri çağırma fonksiyonları render'lar arasında aynı kalır", () => {
    const hook = renderHook(() => useMask("tckn"));
    const first = hook.result;
    first.inputProps.onChange({ target: { value: "123", selectionStart: 3 } });
    assert.equal(hook.result.inputProps.onChange, first.inputProps.onChange);
    assert.equal(hook.result.inputProps.ref, first.inputProps.ref);
    assert.equal(hook.result.setValue, first.setValue);
  });

  it("setValue ve reset imleci taşımaz", () => {
    const hook = renderHook(() => useMask("money"));
    const element = fakeElement();
    hook.result.inputProps.ref(element as MaskInputElement);
    hook.result.setValue("1234,5");
    assert.equal(hook.result.value, "1.234,5");
    assert.equal(element.selection, null);
    hook.result.reset();
    assert.equal(hook.result.value, "");
  });

  it("tür değişince maskeyi yeniden oluşturur", () => {
    let kind: MaskKind = "tckn";
    const hook = renderHook(() => useMask(kind, { initialValue: "34abc12" }));
    assert.equal(hook.result.value, "3412");
    kind = "plate";
    hook.rerender();
    assert.equal(hook.result.value, "34");
    hook.result.setValue("34abc12");
    assert.equal(hook.result.value, "34 ABC 12");
  });

  it("her render'da yeni Mask nesnesi verilmesi döngüye yol açmaz", () => {
    const hook = renderHook(() => useMask(new IbanMask()));
    hook.rerender();
    hook.rerender();
    hook.result.inputProps.onChange({ target: { value: "tr33", selectionStart: 4 } });
    assert.equal(hook.result.value, "TR33");
    assert.ok(hook.renders < 10);
  });

  it("imleç desteklenmeyen input'ta ve input bağlanmadan hata vermez", () => {
    const hook = renderHook(() => useMask("vkn"));
    hook.result.inputProps.onChange({ target: { value: "12", selectionStart: null } });
    assert.equal(hook.result.value, "12");
    hook.result.inputProps.ref({
      selectionStart: 0,
      setSelectionRange() {
        throw new Error("desteklenmiyor");
      },
    });
    hook.result.inputProps.onChange({ target: { value: "123", selectionStart: 3 } });
    assert.equal(hook.result.value, "123");
    hook.result.inputProps.ref(null);
  });
});
