import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Klasördeki tüm dosyaları alt klasörlerle birlikte listeler. */
export function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** Kaynak koddaki import, export-from ve require hedeflerini döner. Yorumlar atlanır. */
export function specifiers(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  const found = [];
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    for (const match of code.matchAll(re)) found.push(match[1]);
  }
  return found;
}

export function isRelative(spec) {
  return spec.startsWith("./") || spec.startsWith("../");
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function fail(message) {
  console.error(`\nHATA: ${message}\n`);
  process.exit(1);
}
