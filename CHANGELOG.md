# Değişiklik Günlüğü

Bu proje [Semantic Versioning](https://semver.org/lang/tr/) kullanır.

## [Yayınlanmadı]

### Eklendi

- `tckn`: TC Kimlik No ve Yabancı Kimlik No doğrulama, maskeleme, tür tespiti ve test numarası üretimi.
- `vkn`: Vergi Kimlik No doğrulama, maskeleme, VKN/TCKN ayrımı ve test numarası üretimi.
- `iban`: TR IBAN doğrulama, formatlama, maskeleme, banka kodu tespiti ve parçalara ayırma.
- `phone`: Cep, sabit hat, 0850/0800/0900 ve 444 numaraları için doğrulama, E.164 dönüşümü, formatlama, maskeleme, tür ve alan kodu tespiti.
- `card`: Kart numarası doğrulama (Luhn), ağ tespiti (Visa, Mastercard, Troy, Amex), formatlama, maskeleme, son kullanma tarihi ve CVV kontrolü.
- `text`: Türkçe büyük/küçük harf, başlık biçimi, Türk alfabesine göre sıralama, arama için sadeleştirme, slugify, sayıyı yazıya çevirme ve ses uyumuna göre hal ekleri.
- `money`: Türkçe para biçimi, tutar okuma, tutarı yazıyla yazma ve KDV hesapları.
- `address`: 81 il ve plaka kodları, il arama, posta kodu yapı kontrolü.
- `date`: Türkçe tarih biçimi, göreli zaman, sabit resmî tatiller, iş günü hesapları (ek tatil ve hafta sonu ayarı ile).
- `company`: MERSİS numarası biçim kontrolü.
- `vehicle`: Plaka doğrulama, formatlama ve il tespiti; şasi numarası (VIN) doğrulama ve isteğe bağlı kontrol basamağı denetimi.
- Her modül için `turkiye.js/<modül>` alt yolu.
- Çekirdek (`core`): `Result` tipi, `ErrorCode` ve `ERROR_CODES`, `TurkiyeError`, `Brand` tipi, `setMessages` ve `resetMessages`, `StandardSchemaV1` arayüzü.
- Proje altyapısı: ESM + CJS build, `node:test` testleri, boyut sınırı, paket kontrolleri ve CI.
