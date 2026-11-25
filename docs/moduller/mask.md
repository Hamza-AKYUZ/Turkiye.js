[Doküman](../README.md) / Modüller / **mask**

# mask: Yazarken format

```ts nocheck
import { mask } from "turkiye.js";
import { createMask, IbanMask } from "turkiye.js/mask";
```

Kullanıcı yazarken girdiyi biçimler: IBAN dörderli gruplanır, telefona baştaki 0 eklenir, tutara binlik ayraç konur. İmleç konumu korunur. Maskeler framework'ten bağımsızdır; React için [useMask](./react.md), saf JavaScript için `attachMask` kullanılır.

## Maskeler

| Sınıf | `createMask` adı | Davranış |
|---|---|---|
| `TcknMask` | `"tckn"` | Yalnız rakam, en fazla 11 hane |
| `VknMask` | `"vkn"` | Yalnız rakam, en fazla 10 hane |
| `IbanMask` | `"iban"` | Dörderli gruplar; rakamla başlanırsa `TR` eklenir, "IBAN:" atılır |
| `PhoneMask` | `"phone"` | `0532 123 45 67`; baştaki 0 eklenir, `+90` atılır, `444 1 234` |
| `CardMask` | `"card"` | Amex 4-6-5, diğerleri dörderli; en fazla 19 hane |
| `PlateMask` | `"plate"` | `34 ABC 123`; sırası yanlış karakterler ve Q, W, X alınmaz |
| `MoneyMask` | `"money"` | `1.234.567,5`; ondalık ayraç virgül |

## Mask sınıfı

| Üye | Döner | Açıklama |
|---|---|---|
| `input(metin, imleç?)` | `MaskState` | Input'un yeni değerini işler |
| `state` | `MaskState` | Son durum |
| `reset()` | `MaskState` | Durumu sıfırlar |

`MaskState`:

| Alan | Açıklama |
|---|---|
| `value` | Ayraçlarla yazılmış değer; input'a yazılır |
| `raw` | Ayraçsız temiz değer; kaydedilir ya da doğrulanır |
| `cursor` | İmlecin `value` içindeki yeni konumu |
| `complete` | Girdi tamamlandı ve geçerli mi |

## Örnekler

```ts
import { createMask, IbanMask, PhoneMask } from "turkiye.js/mask";

new IbanMask().input("tr3300061"); // { value: "TR33 0006 1", raw: "TR3300061", cursor: 11, complete: false }
new IbanMask().input("3300061").value; // "TR33 0006 1"
new PhoneMask().input("53212").value; // "0532 12"
new PhoneMask().input("+90 532 123 45 67").complete; // true
createMask("card").input("378282246310005").value; // "3782 822463 10005"
createMask("plate").input("34abc1").value; // "34 ABC 1"
createMask("plate").input("06qx12").value; // "06"
createMask("tckn").input("100 000 001 46").raw; // "10000000146"
```

## İmleç

İmlecin önündeki anlamlı (ayraç olmayan) karakter sayısı korunur. Kullanıcı bir ayracı sildiğinde ondan önceki karakter silinir; böylece silme tuşu ayraçta takılı kalmaz.

```ts
import { MoneyMask, PhoneMask } from "turkiye.js/mask";

const money = new MoneyMask();
money.input("1.234");
money.input("15.234", 2).cursor; // 2

const phone = new PhoneMask();
phone.input("0532 123 45 67");
phone.input("0532123 45 67", 4); // { value: "0531 234 56 7", raw: "0531234567", cursor: 3, complete: false }
```

## MoneyMask

```ts
import { MoneyMask } from "turkiye.js/mask";

const money = new MoneyMask();
money.input("1234567,555").value; // "1.234.567,55"
money.toNumber(); // 1234567.55
new MoneyMask().input(",5").value; // "0,5"
new MoneyMask({ decimals: 0 }).input("12,5").value; // "125"
new MoneyMask().toNumber(); // null
```

Rakamlar soldan sağa yazılır. Nokta tuşu binlik ayraç sayılıp yok sayılır; ondalık kısım virgülle yazılır. `decimals` 0-4 arasıdır (varsayılan 2). Tam kısım 13 hane ile sınırlıdır. Virgülle biten girdide `complete` `false` olur.

## Saf JavaScript: attachMask

```ts nocheck
import { attachMask, IbanMask } from "turkiye.js/mask";

const input = document.querySelector("#iban");
const detach = attachMask(input, new IbanMask());

// Input sayfadan kaldırılmadan önce dinleyici kaldırılır:
detach();
```

`attachMask` input'un `input` olayını dinler, değeri biçimler ve imleci taşır. Input'ta değer varsa bağlanırken biçimlenir; bu sırada odak değiştirilmez. `number` ve `email` gibi imleç konumu desteklemeyen input türlerinde hata vermez. Dönen fonksiyon birden fazla çağrılabilir.

CDN ya da bundler olmadan:

```html
<input id="telefon" inputmode="tel" autocomplete="tel" />
<script type="module">
  import { attachMask, PhoneMask } from "https://cdn.jsdelivr.net/npm/turkiye.js/dist/esm/mask/index.js";
  attachMask(document.querySelector("#telefon"), new PhoneMask());
</script>
```

## Yeni maske yazma

`Mask` sınıfından türetilir ve üç metot yazılır:

```ts nocheck
import { Mask } from "turkiye.js/mask";

class PostalCodeMask extends Mask {
  protected clean(text: string): string {
    return text.replace(/\D/g, "").slice(0, 5);
  }

  protected render(raw: string): string {
    return raw;
  }

  protected isComplete(raw: string): boolean {
    return raw.length === 5;
  }
}
```

`clean` metnin her ön ekinde tutarlı sonuç vermelidir; imleç konumu buna göre hesaplanır. Ayraç karakterleri `separators` alanında tanımlanır (varsayılan boşluk).

---

[Doküman ana sayfası](../README.md) · [Tüm modüller](../README.md#modüller) · Önceki: [vehicle](./vehicle.md) · Sonraki: [react](./react.md)

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
