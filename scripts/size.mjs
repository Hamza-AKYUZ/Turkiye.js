// Giriş dosyalarının gzip boyutunu bağlı dosyalarıyla birlikte ölçer.
// Ölçüm minify edilmemiş çıktı üzerinden yapılır.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { fail, isRelative, ROOT, specifiers } from "./lib.mjs";

// dist/esm altındaki giriş dosyası: bayt cinsinden üst sınır
// Sınırlar, modülün kullandığı core dosyalarını da kapsar.
const BUDGETS = {
  "index.js": 20480,
  "tckn/index.js": 3072,
  "vkn/index.js": 3072,
  "iban/index.js": 3072,
  "phone/index.js": 4096,
  "card/index.js": 3584,
  "text/index.js": 5120,
  "money/index.js": 3072,
  "address/index.js": 2560,
  "date/index.js": 4096,
  "company/index.js": 2560,
  "vehicle/index.js": 4608,
  "mask/index.js": 9216,
  "react/index.js": 10240,
};

function collect(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const spec of specifiers(readFileSync(file, "utf8"))) {
    if (isRelative(spec)) collect(resolve(dirname(file), spec), seen);
  }
  return seen;
}

const ESM = join(ROOT, "dist", "esm");
if (!existsSync(ESM)) fail("dist/esm bulunamadı. Önce npm run build çalıştırılmalı.");

let over = false;
for (const [entry, budget] of Object.entries(BUDGETS)) {
  const files = collect(join(ESM, entry));
  const source = [...files].map((f) => readFileSync(f, "utf8")).join("\n");
  const size = gzipSync(source, { level: 9 }).length;
  const status = size <= budget ? "OK  " : "AŞIM";
  if (size > budget) over = true;
  console.log(`${status} ${entry.padEnd(24)} ${String(size).padStart(6)} B / ${budget} B (gzip, ${files.size} dosya)`);
}

if (over) fail("Boyut sınırı aşıldı.");
