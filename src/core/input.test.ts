import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { group, isDigits, maskAll, randomInt, stripSeparators, toDigits, toInput } from "./input.ts";

describe("maskAll", () => {
  it("harf ve rakamları gizler, diğer karakterleri korur", () => {
    assert.equal(maskAll("TR12 3a+"), "**** **+");
  });
});

describe("randomInt", () => {
  it("0 ile max - 1 arasında kalır", () => {
    assert.equal(randomInt(() => 0, 10), 0);
    assert.equal(randomInt(() => 0.999, 10), 9);
    assert.equal(randomInt(() => 1, 10), 9);
  });
});

describe("group", () => {
  it("verilen uzunluklarda gruplar", () => {
    assert.equal(group("TR330006100519786457841326", [4, 4, 4, 4, 4, 4]), "TR33 0006 1005 1978 6457 8413 26");
    assert.equal(group("5321234567", [3, 3, 2, 2]), "532 123 45 67");
  });

  it("kısa girdide eksik grupları atlar", () => {
    assert.equal(group("53212", [3, 3, 2, 2]), "532 12");
    assert.equal(group("", [3]), "");
  });

  it("ayraç değiştirilebilir", () => {
    assert.equal(group("123456", [2, 2, 2], "-"), "12-34-56");
  });
});

describe("toInput", () => {
  it("metni olduğu gibi döner", () => {
    assert.equal(toInput("abc"), "abc");
    assert.equal(toInput(""), "");
  });

  it("varsayılan olarak sayıyı reddeder", () => {
    assert.equal(toInput(123), null);
  });

  it("allowNumber ile negatif olmayan güvenli tam sayıyı kabul eder", () => {
    assert.equal(toInput(10000000146, true), "10000000146");
    assert.equal(toInput(0, true), "0");
  });

  it("allowNumber olsa da hatalı sayıları reddeder", () => {
    for (const value of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
      assert.equal(toInput(value, true), null);
    }
  });

  it("diğer türleri reddeder", () => {
    for (const value of [null, undefined, {}, [], true, 10n]) {
      assert.equal(toInput(value, true), null);
    }
  });
});

describe("stripSeparators", () => {
  it("boşluk, NBSP, sekme, tire ve noktayı siler", () => {
    assert.equal(stripSeparators(" 100 000 001-46.\t"), "10000000146");
  });

  it("diğer karakterlere dokunmaz", () => {
    assert.equal(stripSeparators("TR33/ab"), "TR33/ab");
  });
});

describe("isDigits", () => {
  it("yalnız rakamsa true", () => {
    assert.equal(isDigits("0123456789"), true);
  });

  it("boş, harf, işaret ya da Unicode rakam varsa false", () => {
    for (const value of ["", "12a", "1 2", "-1", "١٢٣", "１２"]) {
      assert.equal(isDigits(value), false);
    }
  });
});

describe("toDigits", () => {
  it("rakam dizisine çevirir", () => {
    assert.deepEqual(toDigits("10239"), [1, 0, 2, 3, 9]);
    assert.deepEqual(toDigits(""), []);
  });
});
