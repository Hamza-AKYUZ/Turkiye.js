import {
  type Brand,
  card,
  ERROR_CODES,
  type ErrorCode,
  iban,
  type MessageTemplates,
  phone,
  type Result,
  resetMessages,
  setMessages,
  type StandardSchemaV1,
  TurkiyeError,
  money,
  tckn,
  text,
  vkn,
  address,
  company,
  date,
  vehicle,
  mask,
} from "turkiye.js";
import { findProvince, type Province } from "turkiye.js/address";
import { mersis } from "turkiye.js/company";
import { addBusinessDays, type BusinessDayOptions, type Holiday } from "turkiye.js/date";
import { type Iban, bankCode } from "turkiye.js/iban";
import { plate, vin } from "turkiye.js/vehicle";

const city: Province | null = findProvince("istanbul");
const cities: readonly address.Province[] = address.provinces();
const postal: boolean = address.isValidPostalCode("34710", 34);
const registry: company.mersis.Mersis = mersis.parse("0123456789012345");
const options: BusinessDayOptions = { holidays: ["2026-03-20", new Date()], weekend: [0] };
const due: Date = addBusinessDays(new Date(), 5, options);
const list: readonly Holiday[] = date.holidays(2026);
const formattedDate: string = date.format("2026-11-25", "D MMMM YYYY");
const ago: string = date.relative(new Date(), new Date());
const between: number = date.businessDaysBetween("2026-11-27", "2026-12-04");
const carPlate: vehicle.plate.Plate = plate.parse("34 ABC 123");
const plateCity: Province | null = plate.province(carPlate);
const chassis: vin.Vin = vin.parse("1M8GDM9AXKP042788", { checkDigit: true });
// @ts-expect-error: plaka ve şasi numarası farklı tiplerdir
const wrongVin: vin.Vin = carPlate;

void [city, cities, postal, registry, due, list, formattedDate, ago, between, plateCity, chassis, wrongVin];
import { format as formatMoney } from "turkiye.js/money";
import { type GrammaticalCase, suffix } from "turkiye.js/text";

const upper: string = text.toUpper("istanbul");
const sorted: string[] = text.sort(["b", "a"]);
const users: { name: string }[] = text.sort([{ name: "Şule" }], "name");
const byCity: { city: string }[] = text.sort([{ city: "İzmir" }], (item) => item.city);
// @ts-expect-error: nesnede olmayan alan adı
text.sort([{ name: "x" }], "age");
const grammaticalCase: GrammaticalCase = "dative";
const withSuffix: string = suffix("Ankara", grammaticalCase, { proper: true, read: "word", soften: false, harmony: "back" });
// @ts-expect-error: geçersiz hal adı
suffix("Ankara", "vocative");
const words: string = text.numberToWords(12, { joined: true });
const slug: string = text.slugify("Ağaç Ev", { separator: "_" });

const price: string = formatMoney(1234.5, { symbol: "TL", decimals: 2, position: "before" });
// @ts-expect-error: desteklenmeyen para birimi gösterimi
money.format(1, { symbol: "$" });
const amount: number = money.parse("1.234,56 TL");
const net: number = money.removeVat(120, 20) + money.vatOf(120, 20, { included: true }) + money.addVat(1, 20);
const inWords: string = money.toWords(12.5, { joined: false });

void [upper, sorted, users, byCity, withSuffix, words, slug, price, amount, net, inWords];
import * as phoneModule from "turkiye.js/phone";
import { isValid, type Tckn } from "turkiye.js/tckn";

const error = new TurkiyeError("LENGTH", "x");
const code: ErrorCode = error.code;
const codes: readonly ErrorCode[] = ERROR_CODES;

declare function check(): Result<string>;
const result = check();
if (result.ok) {
  const value: string = result.value;
  void value;
} else {
  const message: string = result.message;
  const failedCode: ErrorCode = result.code;
  void message;
  void failedCode;
}

type Custom = Brand<string, "Custom">;
// @ts-expect-error: düz string branded tipe atanamaz
const plain: Custom = "x";

setMessages({ EMPTY: "{label} boş" });
// @ts-expect-error: bilinmeyen hata kodu
setMessages({ NOPE: "x" });
resetMessages();
const templates: Partial<MessageTemplates> = { RANGE: "x" };

const id: tckn.Tckn = tckn.parse("10000000146");
const sameId: Tckn = id;
// @ts-expect-error: farklı branded tipler birbirine atanamaz
const wrong: vkn.Vkn = id;
const validated = tckn.validate(10000000146);
if (validated.ok) {
  const value: Tckn = validated.value;
  void value;
}
const kind: tckn.TcknKind | null = tckn.kind("10000000146");
const taxKind: "vkn" | "tckn" | null = vkn.detectTaxId("1234567890");

const account: Iban = iban.parse("TR330006100519786457841326");
const bankInfo: string | null = bankCode(account);
const parts: iban.IbanInfo | null = iban.info(account);

const number: phone.Phone = phone.parse("0532 123 45 67");
const style: phone.PhoneFormat = "international";
const formatted: string = phone.format(number, style);
const numberType: phoneModule.PhoneType | null = phone.type(number);
const areaInfo: phone.AreaInfo | null = phone.area(number);
// @ts-expect-error: geçersiz biçim adı
phone.format(number, "local");

const network: card.CardBrand | null = card.brand("4543");
const expiry: boolean = card.isExpiryValid(12, 30);
const cvv: boolean = card.isCvvValid("123", network);

const schema: StandardSchemaV1<string | number, Tckn> = tckn.schema();
const ibanSchema: StandardSchemaV1<string, Iban> = iban.schema();
const ok: boolean = isValid("10000000146");

void [code, codes, plain, templates, sameId, wrong, kind, taxKind, bankInfo, parts, formatted, numberType, areaInfo, expiry, cvv, schema, ibanSchema, ok];

import { attachMask, createMask, IbanMask, type MaskableElement, type MaskState, MoneyMask } from "turkiye.js/mask";
import { type MaskChangeEvent, type UseMaskResult, useMask } from "turkiye.js/react";

const moneyMask: MoneyMask = createMask("money", { decimals: 0 });
const maskState: MaskState = new IbanMask().input("tr33", 4);
const typedAmount: number | null = moneyMask.toNumber();
declare const element: MaskableElement;
const detach: () => void = attachMask(element, mask.createMask("phone"));
// @ts-expect-error bilinmeyen maske türü
createMask("email");
declare function hook(): UseMaskResult;
const change: MaskChangeEvent = { target: { value: "1", selectionStart: 1 } };
hook().inputProps.onChange(change);
const useMaskRef: typeof useMask = useMask;
void [maskState, typedAmount, detach, useMaskRef];
