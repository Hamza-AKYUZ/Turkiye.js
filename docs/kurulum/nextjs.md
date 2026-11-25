[Doküman](../README.md) / Kurulum / **Next.js**

# Next.js ile kurulum

App Router ve Pages Router ile çalışır. Doğrulama ve biçimleme fonksiyonları sunucu bileşenlerinde, Server Action'larda ve route handler'larda kullanılır; `useMask` yalnız istemci bileşenlerinde kullanılır.

| Gereksinim | Sürüm |
|---|---|
| Next.js | 13 ve üstü (App Router), Pages Router da desteklenir |
| Ek ayar | Gerekmez (`transpilePackages` gerekmez) |

## 1. Kurulum

```sh
npx create-next-app@latest benim-uygulamam
cd benim-uygulamam
npm install turkiye.js
```

## 2. Sunucu bileşeni

Sunucu bileşenlerinde paketin tüm fonksiyonları doğrudan çağrılır:

```tsx
// app/siparis/[id]/page.tsx
import { date, money } from "turkiye.js";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  return (
    <main>
      <h1>Sipariş {order.no}</h1>
      <p>Tutar: {money.format(order.total)}</p>
      <p>Tarih: {date.format(order.createdAt)}</p>
    </main>
  );
}
```

## 3. İstemci bileşeni: yazarken biçimleme

`useMask` bir React hook'u olduğu için dosyanın başına `"use client"` yazılır:

```tsx
// app/odeme/IbanField.tsx
"use client";

import { useMask } from "turkiye.js/react";

export function IbanField() {
  const iban = useMask("iban");
  return (
    <>
      <input {...iban.inputProps} name="iban" autoComplete="off" />
      <input type="hidden" name="ibanRaw" value={iban.state.raw} />
    </>
  );
}
```

## 4. Server Action ile doğrulama

Tarayıcıdaki maske yalnız kullanıcıya kolaylık sağlar. Asıl doğrulama her zaman sunucuda yapılır:

```tsx
// app/odeme/actions.ts
"use server";

import { iban } from "turkiye.js";

export async function savePayment(formData: FormData) {
  const result = iban.validate(String(formData.get("iban") ?? ""));
  if (!result.ok) return { error: result.message };
  await db.payment.create({ data: { iban: result.value } });
  return { ok: true };
}
```

## 5. Route handler

```ts nocheck
// app/api/vergi-no/route.ts
import { vkn } from "turkiye.js";

export async function POST(request: Request) {
  const { taxId } = await request.json();
  const type = vkn.detectTaxId(taxId);
  if (type === null) return Response.json({ error: "Geçersiz vergi numarası" }, { status: 422 });
  return Response.json({ type });
}
```

Edge runtime'da da çalışır; paket `node:*` modülü kullanmaz.

Örnekler Next.js 15 içindir; Next.js 13 ve 14'te `params` doğrudan nesne olarak gelir (`params.id`).

## Hydration uyarıları

Sunucuda üretilen HTML ile tarayıcıdaki ilk render aynı olmalıdır. Şu iki durumda dikkat edilir:

| Durum | Çözüm |
|---|---|
| `date.relative(tarih)` sunucu ve tarayıcıda farklı anda çalışır | İkinci değeri verin: `date.relative(tarih, simdi)`; `simdi` sunucudan prop olarak gelir |
| `date.format(new Date())` | Tarihi sunucuda üretip prop olarak verin |
| Sunucu UTC'de, kullanıcı Türkiye'de | Sunucuda `TZ=Europe/Istanbul` ayarlayın ya da tarihi ISO metni olarak saat dilimiyle verin |

`useMask` hydration sorunu çıkarmaz: `initialValue` sunucuda ve tarayıcıda aynı sonucu verir, sunucuda `useLayoutEffect` uyarısı oluşmaz.

## Pages Router

`pages/` klasöründe aynı importlar kullanılır; `"use client"` gerekmez. `getServerSideProps` içinde doğrulama yapılabilir.

---

[Doküman ana sayfası](../README.md) · [React](./react.md) · [TypeScript](./typescript.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
