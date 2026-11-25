# company: Şirket

```ts nocheck
import { company } from "turkiye.js";
import { mersis } from "turkiye.js/company";
```

## mersis

MERSİS (Merkezi Sicil Kayıt Sistemi) numarası 16 hanedir. Kontrol basamağı algoritması resmî olarak yayımlanmadığı için yalnız biçim denetlenir.

| Fonksiyon | Döner | Açıklama |
|---|---|---|
| `normalize(x)` | `string` | Boşluk, tire ve noktaları siler |
| `validate(x)` | `Result<Mersis>` | 16 hane, yalnız rakam |
| `isValid(x)` | `boolean` | |
| `parse(x)` | `Mersis` | Geçersizde `TurkiyeError` |
| `format(x)` | `string` | 16 hane |
| `schema()` | `StandardSchemaV1<string, Mersis>` | |

```ts
import { company } from "turkiye.js";

company.mersis.isValid("0123-4567-8901-2345"); // true
company.mersis.format("0123 4567 8901 2345"); // "0123456789012345"
company.mersis.validate("012345678901234").code; // "LENGTH"
company.mersis.validate("012345678901234a").code; // "INVALID_CHARS"
```

Vergi Kimlik No için [vkn](./vkn.md) modülü kullanılır.

---

Türkiye.js bir [AkySoft](https://akysoft.com) ürünüdür.
