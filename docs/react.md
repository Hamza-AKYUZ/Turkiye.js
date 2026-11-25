# react: useMask

```tsx
import { useMask } from "turkiye.js/react";
```

[Maskeyi](./mask.md) bir React input'una bağlar ve imleç konumunu korur.

React yalnız bu alt yolu kullanan projede gerekir; paket React'i isteğe bağlı eş bağımlılık (`>=16.8`) olarak tanımlar. Tip dosyaları React tiplerine bağlı değildir; `@types/react` gerektirmez.

## Kullanım

```tsx
import { useMask } from "turkiye.js/react";

export function IbanInput() {
  const iban = useMask("iban");

  return (
    <label>
      IBAN
      <input {...iban.inputProps} inputMode="text" autoComplete="off" aria-invalid={!iban.state.complete} />
      {iban.state.complete && <small>Geçerli</small>}
    </label>
  );
}
```

## useMask(tür, opts?)

`tür`: `"tckn"`, `"vkn"`, `"iban"`, `"phone"`, `"card"`, `"plate"`, `"money"` ya da bir `Mask` nesnesi.

| Seçenek | Açıklama |
|---|---|
| `initialValue` | İlk değer; sunucuda ve tarayıcıda aynı sonucu verir |
| `decimals` | `"money"` için ondalık hane (0-4) |

Döner:

| Alan | Açıklama |
|---|---|
| `inputProps` | `value`, `onChange`, `ref`; input'a `{...inputProps}` ile verilir |
| `value` | Formatlı değer |
| `state` | `MaskState`: `raw`, `cursor`, `complete` |
| `setValue(metin)` | Değeri koddan değiştirir |
| `reset()` | Değeri temizler |

`inputProps` yalnız input'un tanıdığı üç özelliği içerir; `state` gibi alanlar input'a HTML özelliği olarak geçmez.

## Form gönderme

Ekranda formatlı değer, kayıtta temiz değer kullanılır:

```tsx
import { useMask } from "turkiye.js/react";

export function PaymentForm() {
  const phone = useMask("phone");
  const amount = useMask("money");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!phone.state.complete) return;
    send({ phone: phone.state.raw, amount: amount.state.raw });
    phone.reset();
    amount.reset();
  }

  return (
    <form onSubmit={submit}>
      <input {...phone.inputProps} type="tel" />
      <input {...amount.inputProps} inputMode="decimal" />
      <button type="submit">Gönder</button>
    </form>
  );
}
```

## Kurallar

- Sunucuda `useLayoutEffect` yerine `useEffect` kullanılır; Next.js gibi sunucuda render eden ortamlarda uyarı oluşmaz.
- `Mask` nesnesi ve seçenekler yalnız ilk render'da alınır. Her render'da `new IbanMask()` verilmesi sonsuz render döngüsüne yol açmaz.
- Tür adı değişirse maske yeniden oluşturulur ve mevcut metin yeni maskeye göre yazılır.
- `onChange`, `ref`, `setValue` ve `reset` render'lar arasında aynı kalır; `useEffect` bağımlılık dizilerinde güvenle kullanılır.
- Hook zamanlayıcı ya da olay dinleyicisi eklemez; bileşen kaldırıldığında temizlenecek kaynak yoktur.

React Native'de `TextInput` için maske sınıfları doğrudan kullanılır:

```tsx
import { useRef, useState } from "react";
import { TextInput } from "react-native";
import { PhoneMask } from "turkiye.js/mask";

export function PhoneInput() {
  const mask = useRef(new PhoneMask()).current;
  const [value, setValue] = useState("");
  return <TextInput value={value} onChangeText={(text) => setValue(mask.input(text).value)} keyboardType="phone-pad" />;
}
```

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
