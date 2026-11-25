// Yayınlanacak paketin yapısını ve içeriğini denetler.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fail, readJson, ROOT, walk } from "./lib.mjs";

const pkg = readJson(join(ROOT, "package.json"));
const errors = [];

for (const field of ["dependencies", "optionalDependencies", "bundleDependencies"]) {
  if (pkg[field] && Object.keys(pkg[field]).length > 0) {
    errors.push(`package.json "${field}" alanı boş olmalı.`);
  }
}

// Yalnız react alt yolu için isteğe bağlı react eş bağımlılığına izin verilir.
const peers = Object.keys(pkg.peerDependencies ?? {});
if (peers.some((name) => name !== "react")) errors.push('"peerDependencies" yalnız "react" içerebilir.');
if (peers.includes("react") && pkg.peerDependenciesMeta?.react?.optional !== true) {
  errors.push('"react" eş bağımlılığı isteğe bağlı (optional) olmalı.');
}

function targets(node, path = []) {
  if (typeof node === "string") return [[path.join(" > "), node]];
  return Object.entries(node).flatMap(([key, value]) => targets(value, [...path, key]));
}
for (const [path, target] of targets(pkg.exports)) {
  if (!existsSync(join(ROOT, target))) errors.push(`exports [${path}]: ${target} bulunamadı.`);
}
for (const field of ["main", "module", "types"]) {
  if (pkg[field] && !existsSync(join(ROOT, pkg[field]))) errors.push(`"${field}": ${pkg[field]} bulunamadı.`);
}

const esmDir = join(ROOT, "dist", "esm");
const cjsDir = join(ROOT, "dist", "cjs");
for (const file of walk(esmDir)) {
  const rel = relative(esmDir, file);
  if (!existsSync(join(cjsDir, rel))) errors.push(`dist/cjs içinde eksik dosya: ${rel}`);
}

// Derlenmiş tipler, paketi kullanan bir ESM ve CJS projesi gibi derlenir.
try {
  execFileSync(process.execPath, [join(ROOT, "node_modules", "typescript", "bin", "tsc"), "-p", "test/types/tsconfig.json"], {
    cwd: ROOT,
    stdio: "inherit",
  });
} catch {
  errors.push("test/types tip kontrolünden geçmedi.");
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const packed = JSON.parse(
  execFileSync(npm, ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: process.platform === "win32",
  }),
)[0];
const files = packed.files.map((f) => f.path.replace(/\\/g, "/"));
for (const required of ["package.json", "LICENSE", "README.md"]) {
  if (!files.includes(required)) errors.push(`Pakette ${required} yok.`);
}
for (const file of files) {
  if (/^(src|scripts|test)\//.test(file) || /\.test\./.test(file) || file.startsWith("tsconfig")) {
    errors.push(`Pakette bulunmaması gereken dosya: ${file}`);
  }
}

if (errors.length > 0) fail(`Paket kontrolü başarısız:\n  ${errors.join("\n  ")}`);

console.log(`Paket kontrolü tamamlandı: ${files.length} dosya, ${(packed.size / 1024).toFixed(1)} KB`);
