# Değişiklik Günlüğü

Bu proje [Semantic Versioning](https://semver.org/lang/tr/) kullanır.

## [1.0.0] - 2026-11-26

İlk kararlı sürüm.

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
- `mask`: Yazarken format uygulayan maskeler (`TcknMask`, `VknMask`, `IbanMask`, `PhoneMask`, `CardMask`, `PlateMask`, `MoneyMask`), `createMask` ve framework kullanmayan sayfalar için `attachMask`. İmleç konumu korunur.
- `react`: `useMask` hook'u. `react` isteğe bağlı eş bağımlılıktır; tip dosyaları `@types/react` gerektirmez.
- Her modül için `turkiye.js/<modül>` alt yolu.
- Çekirdek (`core`): `Result` tipi, `ErrorCode` ve `ERROR_CODES`, `TurkiyeError`, `Brand` tipi, `setMessages` ve `resetMessages`, `StandardSchemaV1` arayüzü.
- Proje altyapısı: ESM + CJS build, `node:test` testleri, boyut sınırı, paket kontrolleri ve CI.
- `docs/` klasöründe her modül için doküman; örnek sonuçları her kontrolde derlenmiş pakette doğrulanır.
- `examples/` klasöründe Node, saf HTML ve React örnekleri.
- `vectors/` klasöründe modül başına ortak test vektörleri.

### Düzeltildi

- `text` fonksiyonları metin olmayan girdide `TypeError` fırlatıyordu; artık sayıları metne çevirir, diğer değerleri boş metin sayar.
- Seçenek nesnesi yerine `null` verildiğinde `money`, `text`, `date`, `tckn.generate`, `vkn.generate` ve `vehicle.vin` hata veriyordu.
- `text.suffix` bilinmeyen hal adında sonuna "'undefined" ekliyordu; artık açık mesajlı `TypeError` verir.
- `text.sort` her karşılaştırmada metni yeniden çözüyordu; anahtarlar artık bir kez hesaplanır (20.000 öğede yaklaşık 7 kat hızlı) ve eşit öğelerin sırası korunur.
- `money.addVat`, `removeVat` ve `vatOf` negatif tutarları pozitiflerden farklı yuvarlıyordu.
- `money.parse` çok uzun sayılarda `Infinity` dönüyordu; artık `RANGE` verir. `-0` sonucu `0` olarak döner.
- `date` 0-99 arası yılları 1900'lere kaydırıyordu.
- `date` ISO 8601 dışındaki metinleri tarayıcıya göre farklı yorumluyordu; artık yalnız ISO 8601 kabul edilir.
- `date` başka pencereden (iframe) gelen `Date` nesnelerini tanımıyordu.
- `date.addBusinessDays` ve `businessDaysBetween` uzun aralıklarda olay döngüsünü saniyelerce bloke ediyordu; hesap artık hafta sayısıyla yapılır. Haftanın tüm günleri hafta sonu verildiğinde `RANGE` hatası verilir.
- `date.holidays` önbelleği sınırsız büyüyebiliyordu; boyutu sınırlandı.
- `TurkiyeError` için `instanceof`, paketin ESM ve CommonJS kopyaları birlikte yüklendiğinde çalışmıyordu; `setMessages` ayarı da iki kopya arasında paylaşılmıyordu.
- Hata mesajı şablonlarındaki `$&` gibi diziler yanlış yorumlanıyordu.
- `generate` fonksiyonları geçersiz `random` üretecinde "NaN" içeren numara üretiyordu; artık `TypeError` verir.
- `address.province` prototipsiz nesne girdisinde hata veriyordu.
