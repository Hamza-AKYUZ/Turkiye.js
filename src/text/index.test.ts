import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TurkiyeError } from "../core/errors.ts";
import * as text from "./index.ts";

describe("text.toUpper ve toLower", () => {
  it("i/İ ve ı/I harflerini doğru çevirir", () => {
    assert.equal(text.toUpper("istanbul ılık"), "İSTANBUL ILIK");
    assert.equal(text.toUpper("çğöşü"), "ÇĞÖŞÜ");
    assert.equal(text.toLower("IŞIK İZİ"), "ışık izi");
    assert.equal(text.toLower("ÇĞÖŞÜ"), "çğöşü");
  });

  it("küçük harfe çevirmede birleşik nokta karakteri üretmez", () => {
    assert.equal(text.toLower("İ").length, 1);
  });
});

describe("text.toTitle", () => {
  it("kelimelerin ilk harfini büyütür, bağlaçları küçük bırakır", () => {
    assert.equal(text.toTitle("ali ve veli"), "Ali ve Veli");
    assert.equal(text.toTitle("ALİ VE VELİ ankara'da"), "Ali ve Veli Ankara'da");
    assert.equal(text.toTitle("ve sonra ile"), "Ve Sonra ile");
    assert.equal(text.toTitle("  ılık  su "), "  Ilık  Su ");
    assert.equal(text.toTitle(""), "");
  });
});

describe("text.compare ve sort", () => {
  it("Türk alfabesine göre sıralar", () => {
    assert.deepEqual(text.sort(["şeker", "çay", "su", "cam"]), ["cam", "çay", "su", "şeker"]);
    assert.deepEqual(text.sort(["ışık", "iyi", "ılık", "İnce"]), ["ılık", "ışık", "İnce", "iyi"]);
    assert.deepEqual(text.sort(["ödev", "ozan", "Üzüm", "uçak", "zil", "gül", "ğ"]), [
      "gül",
      "ğ",
      "ozan",
      "ödev",
      "uçak",
      "Üzüm",
      "zil",
    ]);
  });

  it("harf büyüklüğünden bağımsız sıralar; eşitlikte küçük harf ve aksansız önce gelir", () => {
    assert.deepEqual(text.sort(["Âdet", "âdet", "Adet", "adet", "b", "A", "a"]), ["a", "A", "adet", "Adet", "âdet", "Âdet", "b"]);
    assert.deepEqual(["Çiğdem", "Cem", "ceylan", "Ceren", "çağrı"].sort(text.compare), ["Cem", "Ceren", "ceylan", "çağrı", "Çiğdem"]);
  });

  it("yabancı harfleri ve diğer karakterleri yerleştirir", () => {
    assert.deepEqual(text.sort(["xenon", "wifi", "quiz", "vazo", "yol", "pul", "rüya"]), [
      "pul",
      "quiz",
      "rüya",
      "vazo",
      "wifi",
      "xenon",
      "yol",
    ]);
    assert.deepEqual(text.sort(["b", "1", " a", "é"]), [" a", "1", "b", "é"].sort(text.compare));
    assert.ok(text.compare("1", "a") < 0);
    assert.ok(text.compare("é", "f") < 0);
    assert.ok(text.compare("e", "é") < 0);
  });

  it("öneki olan kelime önce gelir, aynı metin eşittir", () => {
    assert.equal(text.compare("kar", "kara"), -1);
    assert.equal(text.compare("kara", "kar"), 1);
    assert.equal(text.compare("Kara", "Kara"), 0);
    assert.equal(text.compare("a", "b"), -1);
    assert.equal(text.compare("b", "a"), 1);
  });

  it("nesne dizisini alan adı ya da seçiciyle sıralar ve diziyi değiştirmez", () => {
    const users = [{ name: "Şule" }, { name: "Can" }, { name: "Çınar" }];
    const original = [...users];
    assert.deepEqual(
      text.sort(users, "name").map((u) => u.name),
      ["Can", "Çınar", "Şule"],
    );
    assert.deepEqual(
      text.sort(users, (u) => u.name).map((u) => u.name),
      ["Can", "Çınar", "Şule"],
    );
    assert.deepEqual(users, original);
  });
});

describe("text.fold, includes ve slugify", () => {
  it("fold Türkçe karakterleri ve aksanları kaldırır", () => {
    assert.equal(text.fold("Şişli Çarşı"), "sisli carsi");
    assert.equal(text.fold("Kâğıt ÖĞÜT İĞNE"), "kagit ogut igne");
    assert.equal(text.fold("Café"), "cafe");
  });

  it("includes büyük/küçük harf ve Türkçe karakter farkını yok sayar", () => {
    assert.equal(text.includes("Şişli Belediyesi", "sisli"), true);
    assert.equal(text.includes("İSTANBUL", "istanbul"), true);
    assert.equal(text.includes("Ankara", "izmir"), false);
  });

  it("slugify URL uyumlu ad üretir", () => {
    assert.equal(text.slugify("Çalışma Saatleri & İletişim!"), "calisma-saatleri-ve-iletisim");
    assert.equal(text.slugify("  Ağaç   Ev  "), "agac-ev");
    assert.equal(text.slugify("Ağaç Ev", { separator: "_" }), "agac_ev");
    assert.equal(text.slugify("2026 Yılı"), "2026-yili");
    assert.equal(text.slugify(" !? "), "");
  });
});

describe("text.numberToWords", () => {
  it("sayıları yazıya çevirir", () => {
    const cases: [number, string][] = [
      [0, "sıfır"],
      [1, "bir"],
      [10, "on"],
      [11, "on bir"],
      [100, "yüz"],
      [101, "yüz bir"],
      [200, "iki yüz"],
      [999, "dokuz yüz doksan dokuz"],
      [1000, "bin"],
      [1001, "bin bir"],
      [2000, "iki bin"],
      [100000, "yüz bin"],
      [123456, "yüz yirmi üç bin dört yüz elli altı"],
      [1000000, "bir milyon"],
      [1001000, "bir milyon bin"],
      [2026, "iki bin yirmi altı"],
      [1_000_000_000, "bir milyar"],
      [-15, "eksi on beş"],
    ];
    for (const [value, expected] of cases) assert.equal(text.numberToWords(value), expected, String(value));
    assert.equal(
      text.numberToWords(Number.MAX_SAFE_INTEGER),
      "dokuz katrilyon yedi trilyon yüz doksan dokuz milyar iki yüz elli dört milyon yedi yüz kırk bin dokuz yüz doksan bir",
    );
  });

  it("bitişik yazım seçeneği", () => {
    assert.equal(text.numberToWords(250, { joined: true }), "ikiyüzelli");
  });

  it("tam sayı olmayan değerde RANGE hatası fırlatır", () => {
    for (const value of [1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53]) {
      assert.throws(() => text.numberToWords(value), (e: unknown) => e instanceof TurkiyeError && e.code === "RANGE");
    }
  });
});

describe("text.suffix", () => {
  const all = (word: string, options?: text.SuffixOptions) =>
    (["accusative", "dative", "locative", "ablative", "genitive", "instrumental"] as const).map((kind) =>
      text.suffix(word, kind, options),
    );

  it("özel isimlerde kesme işaretiyle ses uyumuna göre ek ekler", () => {
    assert.deepEqual(all("Ankara"), ["Ankara'yı", "Ankara'ya", "Ankara'da", "Ankara'dan", "Ankara'nın", "Ankara'yla"]);
    assert.deepEqual(all("İstanbul"), ["İstanbul'u", "İstanbul'a", "İstanbul'da", "İstanbul'dan", "İstanbul'un", "İstanbul'la"]);
    assert.deepEqual(all("İzmir"), ["İzmir'i", "İzmir'e", "İzmir'de", "İzmir'den", "İzmir'in", "İzmir'le"]);
    assert.deepEqual(all("Ordu"), ["Ordu'yu", "Ordu'ya", "Ordu'da", "Ordu'dan", "Ordu'nun", "Ordu'yla"]);
    assert.deepEqual(all("Ürgüp"), ["Ürgüp'ü", "Ürgüp'e", "Ürgüp'te", "Ürgüp'ten", "Ürgüp'ün", "Ürgüp'le"]);
    assert.equal(text.suffix("Mehmet", "dative"), "Mehmet'e");
    assert.equal(text.suffix("New York", "locative"), "New York'ta");
  });

  it("sayılarda okunuşa göre ek ekler", () => {
    const cases: [string, text.GrammaticalCase, string][] = [
      ["5", "dative", "5'e"],
      ["6", "dative", "6'ya"],
      ["10", "dative", "10'a"],
      ["40", "locative", "40'ta"],
      ["3", "ablative", "3'ten"],
      ["100", "accusative", "100'ü"],
      ["2026", "locative", "2026'da"],
      ["1000000", "genitive", "1000000'un"],
      ["3,5", "dative", "3,5'e"],
      ["%50", "accusative", "%50'yi"],
      ["iPhone 15", "dative", "iPhone 15'e"],
      ["12345678901234567890", "dative", "12345678901234567890'a"],
    ];
    for (const [word, kind, expected] of cases) assert.equal(text.suffix(word, kind), expected, word);
  });

  it("kısaltmalarda okunuşu tahmin eder", () => {
    assert.equal(text.suffix("THY", "dative"), "THY'ye");
    assert.equal(text.suffix("ABD", "locative"), "ABD'de");
    assert.equal(text.suffix("TBMM", "genitive"), "TBMM'nin");
    assert.equal(text.suffix("PTT", "ablative"), "PTT'den");
    assert.equal(text.suffix("AB", "dative"), "AB'ye");
    assert.equal(text.suffix("NATO", "dative"), "NATO'ya");
    assert.equal(text.suffix("TÜBİTAK", "locative"), "TÜBİTAK'ta");
    assert.equal(text.suffix("ODTÜ", "dative"), "ODTÜ'ye");
  });

  it("okunuş seçenekle değiştirilebilir", () => {
    assert.equal(text.suffix("TOGG", "dative", { read: "word" }), "TOGG'a");
    assert.equal(text.suffix("Nato", "dative", { read: "letters" }), "Nato'ya");
  });

  it("cins isimlerde kesme işareti kullanmaz ve ünsüz yumuşaması yapar", () => {
    assert.deepEqual(all("kitap"), ["kitabı", "kitaba", "kitapta", "kitaptan", "kitabın", "kitapla"]);
    assert.equal(text.suffix("ağaç", "dative"), "ağaca");
    assert.equal(text.suffix("bardak", "accusative"), "bardağı");
    assert.equal(text.suffix("renk", "accusative"), "rengi");
    assert.equal(text.suffix("RENK", "accusative", { proper: false, read: "word" }), "RENGi");
    assert.equal(text.suffix("RENK", "accusative", { proper: false }), "RENKyi");
    assert.equal(text.suffix("top", "accusative"), "topu");
    assert.equal(text.suffix("ev", "genitive"), "evin");
    assert.equal(text.suffix("araba", "accusative"), "arabayı");
  });

  it("yumuşama ve ünlü uyumu seçenekle değiştirilebilir", () => {
    assert.equal(text.suffix("kanat", "accusative", { soften: true }), "kanadı");
    assert.equal(text.suffix("KİTAP", "accusative", { proper: false, soften: true }), "KİTABı");
    assert.equal(text.suffix("hukuk", "accusative", { soften: false }), "hukuku");
    assert.equal(text.suffix("saat", "accusative", { harmony: "front" }), "saati");
    assert.equal(text.suffix("gol", "accusative", { harmony: "front" }), "golü");
    assert.equal(text.suffix("Kitap", "locative", { proper: false }), "Kitapta");
    assert.equal(text.suffix("ankara", "dative", { proper: true }), "ankara'ya");
  });

  it("boş ya da yalnız işaret içeren girdide metni değiştirmez", () => {
    assert.equal(text.suffix("", "dative"), "");
    assert.equal(text.suffix(" ... ", "dative"), "...");
  });

  it("ünlüsü olmayan kelimede ince ünlü kullanır", () => {
    assert.equal(text.suffix("brr", "dative", { read: "word" }), "brre");
  });
});

describe("text: hatalı girdi", () => {
  const bad = [undefined, null, {}, [], true] as unknown as string[];

  it("metin olmayan girdide hata vermez", () => {
    for (const value of bad) {
      assert.equal(text.toUpper(value), "");
      assert.equal(text.toLower(value), "");
      assert.equal(text.toTitle(value), "");
      assert.equal(text.fold(value), "");
      assert.equal(text.slugify(value), "");
      assert.equal(text.includes(value, "a"), false);
      assert.equal(text.compare(value, value), 0);
      assert.equal(text.suffix(value, "dative"), "");
    }
    assert.equal(text.toUpper(5 as unknown as string), "5");
  });

  it("null seçenek nesnesini varsayılan kabul eder", () => {
    assert.equal(text.slugify("a b", null as never), "a-b");
    assert.equal(text.suffix("Ankara", "dative", null as never), "Ankara'ya");
    assert.equal(text.numberToWords(5, null as never), "beş");
  });

  it("bilinmeyen hal adında açık hata verir", () => {
    assert.throws(() => text.suffix("ev", "x" as never), /Bilinmeyen hal adı/);
  });

  it("sort dizi olmayan girdide TypeError verir, girdi dizisini değiştirmez", () => {
    assert.throws(() => text.sort(null as never), TypeError);
    const input = ["b", "a"];
    text.sort(input);
    assert.deepEqual(input, ["b", "a"]);
  });

  it("sort eşit öğelerin sırasını korur ve boş öğelerde hata vermez", () => {
    const items = [{ n: "a", i: 1 }, { n: "a", i: 2 }, null, { n: "a", i: 3 }];
    assert.deepEqual(text.sort(items, "n" as never).map((item) => (item as { i: number } | null)?.i ?? 0), [0, 1, 2, 3]);
  });

  it("büyük dizileri makul sürede sıralar", () => {
    const list = Array.from({ length: 20000 }, (_, i) => `kelime${(i * 7919) % 20000}`);
    const start = Date.now();
    text.sort(list);
    assert.ok(Date.now() - start < 400);
  });
});
