import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as address from "./index.ts";

describe("address.provinces", () => {
  it("81 ili plaka kodu sırasıyla döner", () => {
    const list = address.provinces();
    assert.equal(list.length, 81);
    assert.deepEqual(list[0], { code: 1, name: "Adana" });
    assert.deepEqual(list[33], { code: 34, name: "İstanbul" });
    assert.deepEqual(list[80], { code: 81, name: "Düzce" });
    list.forEach((item, index) => assert.equal(item.code, index + 1));
    assert.equal(new Set(list.map((item) => item.name)).size, 81);
  });

  it("aynı ve değiştirilemez listeyi döner", () => {
    assert.equal(address.provinces(), address.provinces());
    assert.ok(Object.isFrozen(address.provinces()));
    assert.ok(Object.isFrozen(address.provinces()[0]));
  });
});

describe("address.province", () => {
  it("plaka koduna göre ili döner", () => {
    assert.deepEqual(address.province(6), { code: 6, name: "Ankara" });
    assert.deepEqual(address.province("06"), { code: 6, name: "Ankara" });
    assert.deepEqual(address.province(" 35 "), { code: 35, name: "İzmir" });
  });

  it("geçersiz kodda null döner", () => {
    for (const value of [0, 82, 1.5, -1, "", "abc", "100"]) assert.equal(address.province(value), null, String(value));
  });
});

describe("address.findProvince", () => {
  it("koda, ada ve ön eke göre bulur", () => {
    assert.equal(address.findProvince(34)?.name, "İstanbul");
    assert.equal(address.findProvince("06")?.name, "Ankara");
    assert.equal(address.findProvince("istanbul")?.name, "İstanbul");
    assert.equal(address.findProvince("İSTANBUL")?.name, "İstanbul");
    assert.equal(address.findProvince("IST")?.name, "İstanbul");
    assert.equal(address.findProvince("ızm")?.name, "İzmir");
    assert.equal(address.findProvince("sanliurfa")?.name, "Şanlıurfa");
    assert.equal(address.findProvince(" çanakkale ")?.name, "Çanakkale");
  });

  it("tam eşleşmeyi ön ekten önce seçer", () => {
    assert.equal(address.findProvince("Kars")?.name, "Kars");
    assert.equal(address.findProvince("Van")?.name, "Van");
  });

  it("bulamazsa null döner", () => {
    assert.equal(address.findProvince("xyz"), null);
    assert.equal(address.findProvince(""), null);
    assert.equal(address.findProvince(99), null);
    assert.equal(address.findProvince(null as never), null);
  });
});

describe("address.isValidPostalCode", () => {
  it("yapıyı kontrol eder", () => {
    assert.equal(address.isValidPostalCode("34710"), true);
    assert.equal(address.isValidPostalCode("01000"), true);
    assert.equal(address.isValidPostalCode(" 81000 "), true);
    for (const value of ["00000", "82000", "3471", "347100", "34a10", ""]) {
      assert.equal(address.isValidPostalCode(value), false, value);
    }
    assert.equal(address.isValidPostalCode(34710 as never), false);
  });

  it("il verilirse il koduyla uyumuna bakar", () => {
    assert.equal(address.isValidPostalCode("34710", "İstanbul"), true);
    assert.equal(address.isValidPostalCode("34710", 34), true);
    assert.equal(address.isValidPostalCode("34710", 6), false);
    assert.equal(address.isValidPostalCode("34710", "olmayan il"), false);
  });
});

describe("address: hatalı girdi", () => {
  it("nesne girdide null döner", () => {
    assert.equal(address.province(Object.create(null) as never), null);
    assert.equal(address.province({} as never), null);
  });
});
