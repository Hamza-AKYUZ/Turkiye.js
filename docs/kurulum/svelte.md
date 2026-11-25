[Doküman](../README.md) / Kurulum / **Svelte ve SvelteKit**

# Svelte ve SvelteKit ile kurulum

Doğrulama ve biçimleme fonksiyonları doğrudan kullanılır. Yazarken biçimleme için `attachMask` bir Svelte action'ı olarak bağlanır.

| Gereksinim | Sürüm |
|---|---|
| Svelte | 3, 4 ve 5 |
| SvelteKit | 1 ve 2 |

## 1. Kurulum

```sh
npx sv create benim-uygulamam
cd benim-uygulamam
npm install turkiye.js
```

## 2. `use:mask` action'ı

```ts nocheck
// src/lib/mask.ts
import { attachMask, createMask, type MaskKind } from "turkiye.js/mask";

export function mask(element: HTMLInputElement, kind: MaskKind) {
  const detach = attachMask(element, createMask(kind));
  return { destroy: detach };
}
```

Kullanım:

```svelte
<script lang="ts">
  import { mask } from "$lib/mask";
</script>

<input use:mask={"iban"} autocomplete="off" />
<input use:mask={"phone"} type="tel" />
```

Input sayfadan kaldırılırken Svelte `destroy` fonksiyonunu çağırır; dinleyici temizlenir.

## 3. Form action ile sunucuda doğrulama

```ts nocheck
// src/routes/odeme/+page.server.ts
import { fail } from "@sveltejs/kit";
import { iban } from "turkiye.js";

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData();
    const result = iban.validate(String(data.get("iban") ?? ""));
    if (!result.ok) return fail(422, { error: result.message });
    return { iban: result.value };
  },
};
```

## 4. Biçimleme

```svelte
<script lang="ts">
  import { date, money } from "turkiye.js";
  export let total: number;
  export let createdAt: string;
</script>

<p>{money.format(total)} ({date.format(createdAt, "D MMMM YYYY")})</p>
```

---

[Doküman ana sayfası](../README.md) · [Vue](./vue.md) · [Tarayıcı](./tarayici.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
