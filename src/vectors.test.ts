// vectors/ klasöründeki ortak test vektörlerini her doğrulama modülünde çalıştırır.
// Aynı dosyalar başka dillerdeki uygulamalar için de kaynak olarak kullanılabilir.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import card from "../vectors/card.json" with { type: "json" };
import iban from "../vectors/iban.json" with { type: "json" };
import mersisVectors from "../vectors/mersis.json" with { type: "json" };
import phone from "../vectors/phone.json" with { type: "json" };
import plateVectors from "../vectors/plate.json" with { type: "json" };
import tckn from "../vectors/tckn.json" with { type: "json" };
import vinVectors from "../vectors/vin.json" with { type: "json" };
import vkn from "../vectors/vkn.json" with { type: "json" };
import * as cardModule from "./card/index.ts";
import { mersis } from "./company/index.ts";
import type { Result } from "./core/result.ts";
import * as ibanModule from "./iban/index.ts";
import * as phoneModule from "./phone/index.ts";
import * as tcknModule from "./tckn/index.ts";
import { plate, vin } from "./vehicle/index.ts";
import * as vknModule from "./vkn/index.ts";

interface VectorFile {
  readonly valid: readonly { readonly input: string; readonly value: string }[];
  readonly invalid: readonly { readonly input: string; readonly code: string }[];
}

interface Validator {
  validate(value: string): Result<string>;
  isValid(value: string): boolean;
}

const suites: readonly [string, VectorFile, Validator][] = [
  ["tckn", tckn, tcknModule],
  ["vkn", vkn, vknModule],
  ["iban", iban, ibanModule],
  ["phone", phone, phoneModule],
  ["card", card, cardModule],
  ["plate", plateVectors, plate],
  ["vin", vinVectors, vin],
  ["mersis", mersisVectors, mersis],
];

for (const [name, vectors, module] of suites) {
  describe(`vectors/${name}.json`, () => {
    it("geçerli örnekleri kabul eder ve beklenen değeri döner", () => {
      assert.ok(vectors.valid.length > 0);
      for (const { input, value } of vectors.valid) {
        assert.deepEqual(module.validate(input), { ok: true, value }, input);
        assert.equal(module.isValid(input), true, input);
      }
    });

    it("geçersiz örnekleri beklenen hata koduyla reddeder", () => {
      assert.ok(vectors.invalid.length > 0);
      for (const { input, code } of vectors.invalid) {
        const result = module.validate(input);
        assert.equal(result.ok ? "OK" : result.code, code, input);
      }
    });
  });
}

describe("generate", () => {
  it("10.000 örnekte yalnız geçerli numara üretir", () => {
    for (let i = 0; i < 10_000; i++) {
      assert.ok(tcknModule.isValid(tcknModule.generate()));
      const foreign = tcknModule.generate({ foreign: true });
      assert.equal(tcknModule.kind(foreign), "foreign");
      assert.ok(vknModule.isValid(vknModule.generate()));
    }
  });
});
