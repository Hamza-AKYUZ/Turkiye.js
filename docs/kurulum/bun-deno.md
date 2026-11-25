[Doküman](../README.md) / Kurulum / **Bun ve Deno**

# Bun ve Deno ile kurulum

Paket her iki ortamda da ek ayar gerekmeden çalışır ve CI'da test edilir.

## Bun

```sh
bun add turkiye.js
```

```ts nocheck
// index.ts
import { iban, tckn } from "turkiye.js";

console.log(tckn.isValid("10000000146")); // true
console.log(iban.format("tr330006100519786457841326"));
```

```sh
bun run index.ts
```

## Deno

Deno 2'de npm paketleri `npm:` önekiyle kullanılır:

```ts nocheck
// main.ts
import { money, tckn } from "npm:turkiye.js@1";

console.log(tckn.isValid("10000000146")); // true
console.log(money.format(1234.56)); // "1.234,56 ₺"
```

```sh
deno run main.ts
```

Paketi `deno.json` dosyasına eklemek için:

```sh
deno add npm:turkiye.js
```

Ardından kısa adla kullanılır:

```ts nocheck
import { tckn } from "turkiye.js";
import { PhoneMask } from "turkiye.js/mask";
```

Paket dosya sistemi, ağ ya da ortam değişkeni kullanmadığı için Deno'da izin bayrağı (`--allow-*`) gerekmez.

## Cloudflare Workers ve diğer edge ortamları

Paket yalnız ECMAScript standardını kullanır; `node:*` modülü, `Buffer` ya da `process` gerektirmez. Cloudflare Workers, Vercel Edge ve Netlify Edge'de `nodejs_compat` gibi bir ayar olmadan çalışır.

```ts nocheck
import { iban } from "turkiye.js";

export default {
  async fetch(request: Request) {
    const body = await request.json();
    return Response.json({ valid: iban.isValid(body.iban) });
  },
};
```

---

[Doküman ana sayfası](../README.md) · [Node.js](./node.md) · [TypeScript](./typescript.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
