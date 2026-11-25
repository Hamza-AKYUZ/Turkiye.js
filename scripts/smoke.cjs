// Derlenmiş paketi CommonJS olarak yükler.
const assert = require("node:assert/strict");
const lib = require("turkiye.js");
const tckn = require("turkiye.js/tckn");

const error = new lib.TurkiyeError("LENGTH", "test");
assert.ok(error instanceof Error);
assert.equal(error.code, "LENGTH");

assert.equal(tckn.isValid("10000000146"), true);
assert.equal(lib.vkn.detectTaxId("10000000146"), "tckn");
assert.equal(lib.iban.mask("TR330006100519786457841326"), "TR33 **** **** **** **** 8413 26");
assert.equal(lib.phone.format("02121234567", "international"), "+90 212 123 45 67");
assert.equal(lib.card.mask("4543590000000006"), "4543 **** **** 0006");
assert.throws(() => lib.iban.parse("TR00"), lib.TurkiyeError);
assert.equal(lib.text.slugify("Çalışma Saatleri"), "calisma-saatleri");
assert.equal(require("turkiye.js/money").parse("1.234,56 TL"), 1234.56);
assert.equal(lib.address.provinces().length, 81);
assert.equal(require("turkiye.js/date").businessDaysBetween("2026-11-27", "2026-12-04"), 5);
assert.equal(require("turkiye.js/vehicle").plate.province("06 A 1234").name, "Ankara");
assert.equal(new (require("turkiye.js/mask").PhoneMask)().input("5321234567").value, "0532 123 45 67");

console.log(`CJS smoke testi tamamlandı (Node ${process.versions.node})`);
