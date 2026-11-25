// ESM ve CommonJS çıktısını üretir, ardından çıktıda dış bağımlılık olmadığını denetler.
// JavaScript yorumsuz üretilir; dokümantasyon .d.ts dosyalarında kalır.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fail, isRelative, ROOT, specifiers, walk } from "./lib.mjs";

const DIST = join(ROOT, "dist");
const ESM = join(DIST, "esm");
const CJS = join(DIST, "cjs");
const TSC = join(ROOT, "node_modules", "typescript", "bin", "tsc");

rmSync(DIST, { recursive: true, force: true });

for (const config of ["tsconfig.build.json", "tsconfig.cjs.json", "tsconfig.types.json"]) {
  console.log(`tsc -p ${config}`);
  try {
    execFileSync(process.execPath, [TSC, "-p", config], { cwd: ROOT, stdio: "inherit" });
  } catch {
    fail(`Derleme başarısız: ${config}`);
  }
}

// tsc, .d.ts dosyalarındaki ".ts" uzantılı göreli yolları dönüştürmez.
for (const file of walk(ESM)) {
  if (!file.endsWith(".d.ts")) continue;
  const source = readFileSync(file, "utf8");
  const fixed = source.replace(/(["'])(\.{1,2}\/[^"']+)\.ts\1/g, "$1$2.js$1");
  if (fixed !== source) writeFileSync(file, fixed);
  const target = join(CJS, relative(ESM, file));
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(file, target);
}

writeFileSync(join(CJS, "package.json"), `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`);

const violations = [];
for (const file of walk(DIST)) {
  if (!/\.(c|m)?js$|\.d\.(c|m)?ts$/.test(file)) continue;
  for (const spec of specifiers(readFileSync(file, "utf8"))) {
    if (!isRelative(spec)) violations.push(`${relative(ROOT, file)}: "${spec}"`);
  }
}
if (violations.length > 0) {
  fail(`Çıktıda dış import bulundu:\n  ${violations.join("\n  ")}`);
}

console.log("Build tamamlandı: dist/esm, dist/cjs");
