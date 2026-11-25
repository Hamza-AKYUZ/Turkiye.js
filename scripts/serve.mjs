// Örnekleri tarayıcıda açmak için küçük statik dosya sunucusu.
// Çalıştırma: npm run build && node scripts/serve.mjs  (varsayılan port 5173)
// Yalnız yerel ağ arayüzünü dinler ve proje klasörü dışındaki dosyaları vermez.
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { ROOT } from "./lib.mjs";

const PORT = Number(process.env.PORT ?? 5173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};
const ALLOWED = [join(ROOT, "examples"), join(ROOT, "dist")];

function resolvePath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  } catch {
    return null;
  }
  if (pathname === "/") pathname = "/examples/browser/index.html";
  const file = normalize(join(ROOT, pathname));
  // Kök dışına çıkan (../) ya da izin verilmeyen klasördeki yollar reddedilir.
  if (!ALLOWED.some((dir) => file === dir || file.startsWith(dir + sep))) return null;
  try {
    const stat = statSync(file);
    return stat.isDirectory() ? join(file, "index.html") : file;
  } catch {
    return null;
  }
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405).end();
    return;
  }
  const file = resolvePath(request.url ?? "/");
  if (file === null) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Bulunamadı");
    return;
  }
  response.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(file)
    .on("error", () => response.destroy())
    .pipe(response);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Örnekler: http://127.0.0.1:${PORT}/`);
});
