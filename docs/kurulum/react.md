[Doküman](../README.md) / Kurulum / **React**

# React ile kurulum

Vite, Create React App, Remix ya da başka bir React projesinde kullanılır. Doğrulama ve biçimleme fonksiyonları her bileşende doğrudan çağrılır; yazarken biçimlenen input'lar için `useMask` hook'u vardır.

| Gereksinim | Sürüm |
|---|---|
| React | 16.8 ve üstü (hook desteği) |
| `@types/react` | Gerekmez |

Next.js için ayrı rehber: [Next.js](./nextjs.md).

## 1. Proje ve kurulum

Yeni proje:

```sh
npm create vite@latest benim-uygulamam -- --template react-ts
cd benim-uygulamam
npm install
npm install turkiye.js
```

Var olan projeye yalnız paket eklenir:

```sh
npm install turkiye.js
```

## 2. Yazarken biçimlenen input

```tsx
import { useMask } from "turkiye.js/react";

export function IbanInput() {
  const iban = useMask("iban");

  return (
    <label>
      IBAN
      <input {...iban.inputProps} autoComplete="off" aria-invalid={!iban.state.complete} />
    </label>
  );
}
```

`iban.inputProps` input'a `value`, `onChange` ve `ref` verir. Kullanıcı `tr3300061` yazdığında input'ta `TR33 0006 1` görünür ve imleç yerinde kalır.

Maske türleri: `"tckn"`, `"vkn"`, `"iban"`, `"phone"`, `"card"`, `"plate"`, `"money"`.

## 3. Form gönderme

Ekranda formatlı değer gösterilir, sunucuya temiz değer gönderilir:

```tsx
import { type FormEvent } from "react";
import { useMask } from "turkiye.js/react";

export function ContactForm() {
  const phone = useMask("phone");
  const tckn = useMask("tckn");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!phone.state.complete || !tckn.state.complete) return;
    fetch("/api/musteri", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: phone.state.raw, tckn: tckn.state.raw }),
    });
  }

  return (
    <form onSubmit={submit}>
      <input {...tckn.inputProps} inputMode="numeric" placeholder="TC Kimlik No" />
      <input {...phone.inputProps} type="tel" placeholder="0532 123 45 67" />
      <button type="submit">Kaydet</button>
    </form>
  );
}
```

| Alan | İçerik |
|---|---|
| `phone.value` | `"0532 123 45 67"` (ekranda görünen) |
| `phone.state.raw` | `"05321234567"` (gönderilecek) |
| `phone.state.complete` | Numara tamamlandı ve geçerli mi |

## 4. Form kütüphaneleriyle

React Hook Form, Formik ya da TanStack Form ile `schema()` kullanılır. Zod örneği:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { iban, tckn } from "turkiye.js";

const schema = z.object({
  tckn: z.string().pipe(tckn.schema()),
  iban: z.string().pipe(iban.schema()),
});

export function SignupForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  return (
    <form onSubmit={form.handleSubmit((data) => console.log(data))}>
      <input {...form.register("tckn")} />
      {form.formState.errors.tckn && <p>{String(form.formState.errors.tckn.message)}</p>}
      <input {...form.register("iban")} />
      <button type="submit">Gönder</button>
    </form>
  );
}
```

Hata mesajları Türkçedir; örneğin "TCKN kontrol basamağı hatalı".

## 5. Biçimleme ve metin

```tsx
import { date, money, text } from "turkiye.js";

export function OrderRow({ name, total, createdAt }: { name: string; total: number; createdAt: string }) {
  return (
    <tr>
      <td>{text.toTitle(name)}</td>
      <td>{money.format(total)}</td>
      <td>{date.format(createdAt, "D MMMM YYYY")}</td>
    </tr>
  );
}
```

Listeleri Türk alfabesine göre sıralamak için `text.sort(users, "name")` kullanılır; `Array.prototype.sort` "Çağla"yı "Zeynep"ten sonraya koyar.

## Sık karşılaşılan durumlar

**İmleç sona atlıyor:** Input'a `value` ve `onChange` ayrı ayrı verilmişse `ref` eksik kalır. Her zaman `{...mask.inputProps}` kullanılır.

**Başlangıç değeri:** `useMask("phone", { initialValue: user.phone })`. Değer sonradan gelirse (ör. API'den) `phone.setValue(user.phone)` çağrılır.

**`useMask` her render'da yeni maske mi oluşturuyor?** Hayır. Maske ilk render'da oluşturulur; tür adı değişmedikçe aynı kalır.

Tam API: [useMask](../moduller/react.md), [maskeler](../moduller/mask.md).

---

[Doküman ana sayfası](../README.md) · [Next.js](./nextjs.md) · [React Native](./react-native.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
