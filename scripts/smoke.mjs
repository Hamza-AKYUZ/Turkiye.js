// Derlenmiş paketi ESM olarak yükler ve CJS çıktısıyla karşılaştırır.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as esm from "turkiye.js";
import * as addressModule from "turkiye.js/address";
import * as cardModule from "turkiye.js/card";
import * as companyModule from "turkiye.js/company";
import * as dateModule from "turkiye.js/date";
import * as vehicleModule from "turkiye.js/vehicle";
import * as ibanModule from "turkiye.js/iban";
import * as maskModule from "turkiye.js/mask";
import * as moneyModule from "turkiye.js/money";
import * as phoneModule from "turkiye.js/phone";
import * as tcknModule from "turkiye.js/tckn";
import * as textModule from "turkiye.js/text";
import * as vknModule from "turkiye.js/vkn";

const require = createRequire(import.meta.url);
const cjs = require("turkiye.js");

const error = new esm.TurkiyeError("CHECKSUM", "test");
assert.ok(error instanceof Error);
assert.equal(error.code, "CHECKSUM");
assert.equal(error.name, "TurkiyeError");

assert.equal(esm.tckn.isValid("10000000146"), true);
assert.equal(esm.vkn.isValid("1234567890"), true);
assert.equal(esm.iban.format("TR330006100519786457841326"), "TR33 0006 1005 1978 6457 8413 26");
assert.equal(esm.phone.normalize("0532 123 45 67"), "+905321234567");
assert.equal(esm.card.brand("9792"), "troy");
assert.throws(() => esm.tckn.parse("1"), esm.TurkiyeError);
assert.equal(esm.text.suffix("Ankara", "dative"), "Ankara'ya");
assert.equal(esm.text.toUpper("istanbul"), "İSTANBUL");
assert.equal(esm.money.format(1234.56), "1.234,56 ₺");
assert.equal(esm.money.toWords(123.5), "yüz yirmi üç lira elli kuruş");
assert.equal(esm.address.findProvince("izmir")?.code, 35);
assert.equal(esm.date.format("2026-11-25"), "25 Kasım 2026 Çarşamba");
assert.equal(esm.date.isBusinessDay("2026-10-29"), false);
assert.equal(esm.company.mersis.isValid("0123456789012345"), true);
assert.equal(esm.vehicle.plate.format("34abc123"), "34 ABC 123");
assert.equal(esm.vehicle.vin.hasValidCheckDigit("1M8GDM9AXKP042788"), true);
assert.equal(esm.mask.createMask("iban").input("tr3300061").value, "TR33 0006 1");

// ESM ve CJS kopyaları birlikte yüklendiğinde hata sınıfı ve mesaj ayarı paylaşılır.
assert.ok(new cjs.TurkiyeError("EMPTY", "x") instanceof esm.TurkiyeError);
assert.ok(new esm.TurkiyeError("EMPTY", "x") instanceof cjs.TurkiyeError);
esm.setMessages({ EMPTY: "ortak" });
assert.equal(cjs.tckn.validate("").message, "ortak");
cjs.resetMessages();
assert.equal(esm.tckn.validate("").message, "TCKN boş olamaz");

// react alt yolu yalnız React kurulu projede yüklenir; burada React yoktur.
await assert.rejects(import("turkiye.js/react"), (e) => String(e?.message).includes("react"));
assert.throws(() => require("turkiye.js/react"), (e) => String(e?.message).includes("react"));

const keys = (module) => Object.keys(module).filter((k) => k !== "default" && k !== "__esModule").sort();
const modules = {
  address: addressModule,
  card: cardModule,
  company: companyModule,
  date: dateModule,
  vehicle: vehicleModule,
  iban: ibanModule,
  mask: maskModule,
  money: moneyModule,
  phone: phoneModule,
  tckn: tcknModule,
  text: textModule,
  vkn: vknModule,
};
for (const [name, module] of Object.entries(modules)) {
  assert.deepEqual(keys(module), keys(esm[name]), `turkiye.js/${name} ana girişle aynı olmalı`);
  assert.deepEqual(keys(module), keys(require(`turkiye.js/${name}`)), `turkiye.js/${name} ESM ve CJS aynı olmalı`);
}
assert.deepEqual(keys(esm), keys(cjs), "ESM ve CJS çıktıları aynı adları dışa aktarmalı");

console.log(`ESM smoke testi tamamlandı (Node ${process.versions.node})`);
