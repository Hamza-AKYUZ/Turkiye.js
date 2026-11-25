import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import { plate, vin } from "./index.ts";

describe("vehicle.plate", () => {
  it("geçerli plakaları kabul eder", () => {
    for (const value of ["34 ABC 123", "34 ABC 12", "06 AB 123", "06 AB 1234", "35 A 1234", "35 A 12345", "01abc12", "81-B-1234"]) {
      assert.equal(plate.isValid(value), true, value);
    }
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["34 ABÇ 123", "INVALID_CHARS"],
      ["34 AQB 123", "INVALID_CHARS"],
      ["34 W 1234", "INVALID_CHARS"],
      ["00 ABC 123", "RANGE"],
      ["82 ABC 123", "RANGE"],
      ["34 ABC 1234", "FORMAT"],
      ["34 A 123", "FORMAT"],
      ["34 AB 12", "FORMAT"],
      ["34 ABCD 12", "FORMAT"],
      ["ABC 123", "FORMAT"],
      [null, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = plate.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });

  it("normalize, format ve parse", () => {
    assert.equal(plate.normalize(" 34 abc-123 "), "34ABC123");
    assert.equal(plate.normalize(5 as never), "");
    assert.equal(plate.format("34abc123"), "34 ABC 123");
    assert.equal(plate.format("06a1234"), "06 A 1234");
    assert.equal(plate.format("34 x"), "34X");
    assert.equal(plate.parse("34 abc 123"), "34ABC123");
    assert.throws(() => plate.parse("99 A 1"), TurkiyeError);
  });

  it("plakanın ilini döner", () => {
    assert.deepEqual(plate.province("34 ABC 123"), { code: 34, name: "İstanbul" });
    assert.deepEqual(plate.province("35 B 12345"), { code: 35, name: "İzmir" });
    assert.equal(plate.province("99 A 1234"), null);
  });

  it("Standard Schema olarak doğrular", () => {
    const schema = plate.schema();
    assert.equal(schema, plate.schema());
    assert.deepEqual(schema["~standard"].validate("34 ABC 123"), { value: "34ABC123" });
    assert.deepEqual(schema["~standard"].validate("1"), { issues: [{ message: "Plaka biçimi geçersiz" }] });
  });
});

describe("vehicle.vin", () => {
  const VALID = "1M8GDM9AXKP042788";
  const EUROPEAN = "WVWZZZ1JZXW000001";

  it("17 karakterli numarayı kabul eder", () => {
    assert.equal(vin.isValid(VALID), true);
    assert.equal(vin.isValid(EUROPEAN), true);
    assert.equal(vin.isValid("1m8gdm9a-xkp042788"), true);
  });

  it("hata kodlarını doğru verir", () => {
    const cases: [unknown, string][] = [
      ["", "EMPTY"],
      ["1M8GDM9AXKP04278O", "INVALID_CHARS"],
      ["1M8GDM9AXKP04278I", "INVALID_CHARS"],
      ["1M8GDM9AXKP04278Q", "INVALID_CHARS"],
      ["1M8GDM9AXKP0427", "LENGTH"],
      [undefined, "FORMAT"],
    ];
    for (const [input, code] of cases) {
      const result = vin.validate(input as string);
      assert.equal(result.ok, false, String(input));
      if (!result.ok) assert.equal(result.code, code, String(input));
    }
  });

  it("kontrol basamağını yalnız istenirse denetler", () => {
    assert.equal(vin.isValid(EUROPEAN, { checkDigit: true }), false);
    const result = vin.validate(EUROPEAN, { checkDigit: true });
    assert.ok(!result.ok);
    assert.equal(result.code, "CHECKSUM");
    assert.equal(vin.isValid(VALID, { checkDigit: true }), true);
    assert.equal(vin.hasValidCheckDigit("1HGCM82633A004352"), true);
    assert.equal(vin.hasValidCheckDigit("11111111111111111"), true);
    assert.equal(vin.hasValidCheckDigit(EUROPEAN), false);
    assert.equal(vin.hasValidCheckDigit("123"), false);
  });

  it("normalize, format, parse ve schema", () => {
    assert.equal(vin.normalize(" 1m8g dm9a xkp0 42788 "), VALID);
    assert.equal(vin.normalize({} as never), "");
    assert.equal(vin.format("1m8gdm9axkp042788"), VALID);
    assert.equal(vin.format("abc"), "ABC");
    assert.equal(vin.parse(VALID), VALID);
    assert.throws(() => vin.parse(EUROPEAN, { checkDigit: true }), TurkiyeError);
    assert.equal(vin.schema(), vin.schema());
    assert.deepEqual(vin.schema()["~standard"].validate(EUROPEAN), { value: EUROPEAN });
  });
});
