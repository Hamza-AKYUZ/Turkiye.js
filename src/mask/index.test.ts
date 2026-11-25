import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attachMask,
  CardMask,
  createMask,
  IbanMask,
  type MaskableElement,
  MoneyMask,
  PhoneMask,
  PlateMask,
  TcknMask,
  VknMask,
} from "./index.ts";

/** Harfleri tek tek yazar ve son durumu döner. */
function typeText(mask: { input(text: string, cursor?: number): { value: string } }, text: string) {
  let value = "";
  let state = mask.input("");
  for (const char of text) {
    state = mask.input(value + char);
    value = state.value;
  }
  return state;
}

describe("TcknMask ve VknMask", () => {
  it("yalnız rakamları alır ve uzunluğu sınırlar", () => {
    const state = new TcknMask().input("100 000 001 46 99");
    assert.equal(state.value, "10000000146");
    assert.equal(state.complete, true);
    assert.equal(new TcknMask().input("1000a").value, "1000");
    assert.equal(new VknMask().input("1234567890123").value, "1234567890");
    assert.equal(new VknMask().input("1234567890").complete, true);
  });
});

describe("IbanMask", () => {
  it("dörderli gruplar ve büyük harf yazar", () => {
    const state = new IbanMask().input("tr3300061");
    assert.deepEqual(state, { value: "TR33 0006 1", raw: "TR3300061", cursor: 11, complete: false });
  });

  it("rakamla başlanırsa TR ekler, IBAN ön ekini atar", () => {
    assert.equal(new IbanMask().input("3300061").value, "TR33 0006 1");
    const state = new IbanMask().input("IBAN: TR33 0006 1005 1978 6457 8413 26");
    assert.equal(state.raw, "TR330006100519786457841326");
    assert.equal(state.complete, true);
  });

  it("harf harf yazımda doğru biçimi korur", () => {
    assert.equal(typeText(new IbanMask(), "TR330006100519786457841326").value, "TR33 0006 1005 1978 6457 8413 26");
  });
});

describe("PhoneMask", () => {
  it("baştaki 0'ı ekler ve gruplar", () => {
    assert.equal(new PhoneMask().input("53212").value, "0532 12");
    assert.equal(typeText(new PhoneMask(), "5321234567").value, "0532 123 45 67");
  });

  it("ülke kodunu atar", () => {
    for (const value of ["+90 532 123 45 67", "0090 532 123 45 67", "905321234567"]) {
      const state = new PhoneMask().input(value);
      assert.equal(state.value, "0532 123 45 67");
      assert.equal(state.complete, true);
    }
  });

  it("444 numaralarını ayrı biçimde yazar", () => {
    assert.equal(new PhoneMask().input("4441444").value, "444 1 444");
  });
});

describe("CardMask", () => {
  it("ağa göre gruplar", () => {
    assert.equal(new CardMask().input("454359000000").value, "4543 5900 0000");
    assert.equal(new CardMask().input("3782822463100059").value, "3782 822463 10005");
    assert.equal(new CardMask().input("4543590000000006").complete, true);
    assert.equal(new CardMask().input("4".repeat(25)).raw.length, 19);
  });
});

describe("PlateMask", () => {
  it("il kodu, harf ve rakam gruplarını ayırır", () => {
    assert.equal(new PlateMask().input("34abc1").value, "34 ABC 1");
    assert.equal(new PlateMask().input("35b12345").complete, true);
  });

  it("sırası yanlış ve yasak karakterleri almaz", () => {
    assert.equal(new PlateMask().input("06qx12").value, "06");
    assert.equal(new PlateMask().input("3a").value, "3");
    assert.equal(new PlateMask().input("34ABCD1234").value, "34 ABC 123");
    assert.equal(new PlateMask().input("34A1B").value, "34 A 1");
  });
});

describe("MoneyMask", () => {
  it("binlik ayraç ve ondalık kısmı yazar", () => {
    const mask = new MoneyMask();
    assert.equal(mask.input("1234567,555").value, "1.234.567,55");
    assert.equal(mask.toNumber(), 1234567.55);
    assert.equal(new MoneyMask().input("0012,").value, "12,");
    assert.equal(new MoneyMask().input(",5").value, "0,5");
    assert.equal(new MoneyMask().input("1.234.5678").value, "12.345.678");
  });

  it("decimals seçeneğine uyar", () => {
    assert.equal(new MoneyMask({ decimals: 0 }).input("12,5").value, "125");
    assert.equal(new MoneyMask({ decimals: 4 }).input("1,23456").value, "1,2345");
    assert.throws(() => new MoneyMask({ decimals: 5 }), RangeError);
  });

  it("boş girdide toNumber null döner, virgülle biten girdi tamamlanmamıştır", () => {
    const mask = new MoneyMask();
    assert.equal(mask.toNumber(), null);
    assert.equal(mask.input("5,").complete, false);
    assert.equal(mask.input("").complete, false);
  });

  it("tam kısmı güvenli uzunlukla sınırlar", () => {
    assert.equal(new MoneyMask().input("9".repeat(20)).raw.length, 13);
  });
});

describe("Mask: imleç", () => {
  it("araya yazılan karakterden sonra imleci korur", () => {
    const mask = new MoneyMask();
    mask.input("1.234");
    const state = mask.input("15.234", 2);
    assert.equal(state.value, "15.234");
    assert.equal(state.cursor, 2);
  });

  it("ayraç silindiğinde önceki karakteri siler", () => {
    const mask = new PhoneMask();
    mask.input("05321234567");
    const state = mask.input("0532123 45 67", 4);
    assert.equal(state.value, "0531 234 56 7");
    assert.equal(state.cursor, 3);
  });

  it("IBAN ayracı silinince önceki rakam silinir; geçersiz imleçte hata vermez", () => {
    const mask = new IbanMask();
    mask.input("TR33 0006");
    assert.equal(mask.input("TR330006", 4).value, "TR30 006");
    assert.equal(mask.input("TR33", 99).cursor, 4);
    assert.equal(mask.input("TR33", -5).cursor, 0);
    assert.equal(mask.input("TR33", 1.5).cursor, 4);
  });

  it("metin olmayan girdiyi boş kabul eder ve reset ile sıfırlanır", () => {
    const mask = new TcknMask();
    assert.equal(mask.input(null as never).value, "");
    mask.input("123");
    assert.equal(mask.state.raw, "123");
    assert.equal(mask.reset().value, "");
    assert.equal(mask.state.raw, "");
  });

  it("durum nesnesi değiştirilemez", () => {
    assert.ok(Object.isFrozen(new TcknMask().input("1")));
  });
});

describe("createMask", () => {
  it("tür adına göre maske oluşturur", () => {
    assert.ok(createMask("tckn") instanceof TcknMask);
    assert.ok(createMask("vkn") instanceof VknMask);
    assert.ok(createMask("iban") instanceof IbanMask);
    assert.ok(createMask("phone") instanceof PhoneMask);
    assert.ok(createMask("card") instanceof CardMask);
    assert.ok(createMask("plate") instanceof PlateMask);
    assert.equal(createMask("money", { decimals: 0 }).input("1,5").value, "15");
    assert.throws(() => createMask("x" as never), TypeError);
  });
});

class FakeInput implements MaskableElement {
  value = "";
  selectionStart: number | null = null;
  selection: [number, number] | null = null;
  listeners = new Set<() => void>();
  throwOnSelect = false;

  setSelectionRange(start: number, end: number): void {
    if (this.throwOnSelect) throw new Error("desteklenmiyor");
    this.selection = [start, end];
  }

  addEventListener(_type: "input", listener: () => void): void {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "input", listener: () => void): void {
    this.listeners.delete(listener);
  }

  type(value: string, cursor = value.length): void {
    this.value = value;
    this.selectionStart = cursor;
    for (const listener of this.listeners) listener();
  }
}

describe("attachMask", () => {
  it("girdiyi biçimler, imleci taşır ve dinleyiciyi kaldırır", () => {
    const input = new FakeInput();
    const detach = attachMask(input, new IbanMask());
    input.type("tr3300061");
    assert.equal(input.value, "TR33 0006 1");
    assert.deepEqual(input.selection, [11, 11]);
    detach();
    detach();
    assert.equal(input.listeners.size, 0);
    input.type("tr33");
    assert.equal(input.value, "tr33");
  });

  it("mevcut değeri imleci taşımadan biçimler", () => {
    const input = new FakeInput();
    input.value = "5321234567";
    attachMask(input, new PhoneMask());
    assert.equal(input.value, "0532 123 45 67");
    assert.equal(input.selection, null);
  });

  it("imleç desteklenmeyen input türünde hata vermez", () => {
    const input = new FakeInput();
    input.throwOnSelect = true;
    attachMask(input, new TcknMask());
    input.type("12a3");
    assert.equal(input.value, "123");
  });
});
