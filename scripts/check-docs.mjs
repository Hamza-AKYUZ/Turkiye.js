// README ve docs/ içindeki kod örneklerini derlenmiş pakette çalıştırır.
//
// Kurallar:
// - Yalnız "```ts" ve "```js" blokları çalıştırılır. Bilgi satırında "nocheck"
//   geçen bloklar ve turkiye.js dışında paket içe aktaran bloklar atlanır.
// - `ifade; // değer` biçimindeki satırlarda yorum bir JavaScript değeri ise
//   (metin, sayı, dizi, nesne, true, false, null) ifadenin sonucu bu değerle
//   karşılaştırılır. Açıklama içeren yorumlar karşılaştırılmaz.
// - Örnekler ayrı bir vm bağlamında çalışır.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { fail, ROOT } from "./lib.mjs";

const ESM = join(ROOT, "dist", "esm");
const files = [join(ROOT, "README.md")];
const docsDir = join(ROOT, "docs");
if (existsSync(docsDir)) {
  for (const name of readdirSync(docsDir).sort()) if (name.endsWith(".md")) files.push(join(docsDir, name));
}

const moduleCache = new Map();
async function load(specifier) {
  const match = /^turkiye\.js(?:\/([a-z]+))?$/.exec(specifier);
  if (match === null) return null;
  const path = match[1] === undefined ? join(ESM, "index.js") : join(ESM, match[1], "index.js");
  if (!moduleCache.has(path)) moduleCache.set(path, await import(pathToFileURL(path).href));
  return moduleCache.get(path);
}

/**
 * Yorum bir JavaScript değeri ise değeri, değilse `undefined` döner. Sondaki
 * parantez içi açıklama yok sayılır: `// false (Cumhuriyet Bayramı)`.
 */
function literal(comment, context) {
  if (!/^["'[{\-0-9]|^(true|false|null)\b/.test(comment)) return undefined;
  const candidates = [comment, comment.replace(/\s+\([^()]*\)$/, "")];
  for (const candidate of candidates) {
    try {
      return { value: new vm.Script(`(${candidate}\n)`).runInContext(context) };
    } catch {
      // Bir sonraki biçim denenir.
    }
  }
  return undefined;
}

const IMPORT = /^import\s+(?:type\s+)?(\{[^}]*\}|\*\s+as\s+\w+)\s+from\s+["']([^"']+)["'];?\s*$/;

const errors = [];
let checked = 0;
let blocks = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const fence = /^```(\S*)([^\n]*)\n([\s\S]*?)^```/gm;
  for (const match of source.matchAll(fence)) {
    const [, lang, info, code] = match;
    if (!["ts", "js"].includes(lang) || info.includes("nocheck")) continue;
    const startLine = source.slice(0, match.index).split("\n").length + 1;
    const where = (offset) => `${relative(ROOT, file)}:${startLine + offset}`;

    const bindings = {};
    const body = [];
    const expectations = [];
    let skip = false;
    const lines = code.split("\n");
    const context = vm.createContext({});

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const imported = IMPORT.exec(line.trim());
      if (imported) {
        const namespace = await load(imported[2]);
        if (namespace === null) {
          skip = true;
          break;
        }
        const clause = imported[1];
        if (clause.startsWith("*")) {
          bindings[clause.split(/\s+/).pop()] = namespace;
        } else {
          for (const part of clause.slice(1, -1).split(",")) {
            const name = part.trim();
            if (name === "" || name.startsWith("type ")) continue;
            const [original, alias = original] = name.split(/\s+as\s+/);
            if (!(original in namespace)) errors.push(`${where(i)}: "${original}" ${imported[2]} içinde yok`);
            bindings[alias] = namespace[original];
          }
        }
        body.push("");
        continue;
      }
      const check = /^(?!\s*(?:const|let|var|import|export|if|else|for|while|do|return|throw|try|catch|switch|case|function|class)\b)(\s*)(.+?);?\s*\/\/\s*(.+?)\s*$/.exec(line);
      const expected = check ? literal(check[3], context) : undefined;
      if (check && expected !== undefined) {
        expectations.push({ offset: i, expected: expected.value });
        body.push(`${check[1]}__check(${expectations.length - 1}, () => (${check[2]}));`);
      } else {
        body.push(line);
      }
    }
    if (skip) continue;
    blocks++;

    Object.assign(context, bindings, {
      __check(index, run) {
        const { offset, expected } = expectations[index];
        checked++;
        try {
          assert.deepStrictEqual(structuredClone(run()), structuredClone(expected));
        } catch (error) {
          const detail = error instanceof assert.AssertionError ? `\n    beklenen: ${JSON.stringify(expected)}\n    sonuç:    ${JSON.stringify(error.actual)}` : ` ${error}`;
          errors.push(`${where(offset)}: örnek sonucu tutmuyor${detail}`);
        }
      },
    });
    try {
      new vm.Script(body.join("\n"), { filename: where(0) }).runInContext(context);
    } catch (error) {
      errors.push(`${where(0)}: blok çalıştırılamadı: ${error}`);
    } finally {
      // setMessages ayarı paylaşıldığı için her bloktan sonra sıfırlanır.
      (await load("turkiye.js")).resetMessages();
    }
  }
}

if (errors.length > 0) fail(`Doküman örnekleri hatalı:\n  ${errors.join("\n  ")}`);
console.log(`Doküman örnekleri doğrulandı: ${blocks} blok, ${checked} sonuç (${files.length} dosya)`);
