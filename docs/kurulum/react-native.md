[Doküman](../README.md) / Kurulum / **React Native ve Expo**

# React Native ve Expo ile kurulum

Paket `Intl` kullanmadığı için Hermes motorunda ek ayar ya da polyfill gerekmez. Türkçe büyük/küçük harf, sıralama ve tarih yazımı Android ve iOS'ta aynı sonucu verir.

| Gereksinim | Sürüm |
|---|---|
| React Native | Güncel sürümler (Hermes ya da JSC) |
| Expo | Güncel SDK sürümleri |
| Ek ayar | Gerekmez |

## 1. Kurulum

```sh
npx create-expo-app benim-uygulamam
cd benim-uygulamam
npm install turkiye.js
```

## 2. Yazarken biçimlenen TextInput

React Native'in `TextInput` bileşeni `onChangeText` kullandığı için maske sınıfı doğrudan kullanılır:

```tsx
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { PhoneMask } from "turkiye.js/mask";

export function PhoneInput() {
  const mask = useRef(new PhoneMask()).current;
  const [value, setValue] = useState("");
  const [complete, setComplete] = useState(false);

  function change(text: string) {
    const state = mask.input(text);
    setValue(state.value);
    setComplete(state.complete);
  }

  return (
    <View>
      <TextInput value={value} onChangeText={change} keyboardType="phone-pad" placeholder="0532 123 45 67" />
      {complete && <Text>Geçerli numara</Text>}
    </View>
  );
}
```

Diğer maskeler: `TcknMask`, `VknMask`, `IbanMask`, `CardMask`, `PlateMask`, `MoneyMask`. Klavye türü önerileri:

| Maske | `keyboardType` |
|---|---|
| `TcknMask`, `VknMask`, `CardMask` | `"number-pad"` |
| `PhoneMask` | `"phone-pad"` |
| `MoneyMask` | `"decimal-pad"` |
| `IbanMask`, `PlateMask` | `"default"`, `autoCapitalize="characters"` |

## 3. Doğrulama ve biçimleme

```tsx
import { Text } from "react-native";
import { date, money, text } from "turkiye.js";

export function Summary({ name, total }: { name: string; total: number }) {
  return (
    <Text>
      {text.toTitle(name)}: {money.format(total)} ({date.format(new Date(), "D MMMM")})
    </Text>
  );
}
```

## Notlar

- `turkiye.js/react` alt yolundaki `useMask` web input'ları içindir; React Native'de yukarıdaki gibi maske sınıfı kullanılır.
- Metro, `package.json` içindeki `exports` alanını React Native 0.79 ve üstünde varsayılan olarak okur; alt yollar (`turkiye.js/mask`) bu sürümlerde ek ayar olmadan çalışır.
- Daha eski sürümlerde ana giriş kullanılır: `import { mask } from "turkiye.js"`, ardından `new mask.PhoneMask()`. Ya da `metro.config.js` içinde `resolver.unstable_enablePackageExports = true` ayarı açılır.

---

[Doküman ana sayfası](../README.md) · [React](./react.md) · [Maskeler](../moduller/mask.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
