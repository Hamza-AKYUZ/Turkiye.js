[Doküman](../README.md) / Kurulum / **Vue ve Nuxt**

# Vue ve Nuxt ile kurulum

Doğrulama ve biçimleme fonksiyonları şablonda ve `computed` içinde doğrudan kullanılır. Yazarken biçimleme için framework'ten bağımsız `attachMask` bir direktifle bağlanır.

| Gereksinim | Sürüm |
|---|---|
| Vue | 3 |
| Nuxt | 3 |

## 1. Kurulum

```sh
npm create vue@latest benim-uygulamam
cd benim-uygulamam
npm install
npm install turkiye.js
```

## 2. Doğrulama ve biçimleme

```vue
<script setup lang="ts">
import { computed, ref } from "vue";
import { money, tckn } from "turkiye.js";

const id = ref("");
const total = ref(1234.5);
const idError = computed(() => {
  const result = tckn.validate(id.value);
  return id.value === "" || result.ok ? "" : result.message;
});
</script>

<template>
  <input v-model="id" inputmode="numeric" />
  <p v-if="idError">{{ idError }}</p>
  <p>Toplam: {{ money.format(total) }}</p>
</template>
```

## 3. Yazarken biçimleme: `v-mask` direktifi

`attachMask` dinleyiciyi kaldıran bir fonksiyon döner; direktif bileşen kaldırılırken bu fonksiyonu çağırır.

```ts nocheck
// src/directives/mask.ts
import type { Directive } from "vue";
import { attachMask, createMask, type MaskKind } from "turkiye.js/mask";

const detachers = new WeakMap<HTMLInputElement, () => void>();

export const vMask: Directive<HTMLInputElement, MaskKind> = {
  mounted(element, binding) {
    detachers.set(element, attachMask(element, createMask(binding.value)));
  },
  beforeUnmount(element) {
    detachers.get(element)?.();
    detachers.delete(element);
  },
};
```

Kullanım:

```vue
<script setup lang="ts">
import { vMask } from "@/directives/mask";
</script>

<template>
  <input v-mask="'iban'" autocomplete="off" />
  <input v-mask="'phone'" type="tel" />
</template>
```

`attachMask` input'un değerini doğrudan değiştirir. Aynı input'ta `v-model` kullanılıyorsa değeri okumak için `@input` olayında `event.target.value` alınır; temiz değer için doğrulama fonksiyonunun `normalize` sonucu kullanılır:

```ts nocheck
import { iban } from "turkiye.js";

const raw = iban.normalize(formattedValue); // "TR330006100519786457841326"
```

## 4. Nuxt

Nuxt'ta aynı importlar kullanılır. Direktif bir eklentiyle tanıtılır:

```ts nocheck
// plugins/mask.ts
import { vMask } from "~/directives/mask";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("mask", vMask);
});
```

Sunucu tarafında (`server/api`) doğrulama:

```ts nocheck
// server/api/musteri.post.ts
import { tckn } from "turkiye.js";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = tckn.validate(body.tckn);
  if (!result.ok) throw createError({ statusCode: 422, statusMessage: result.message });
  return { tckn: result.value };
});
```

---

[Doküman ana sayfası](../README.md) · [Svelte](./svelte.md) · [Tarayıcı](./tarayici.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
