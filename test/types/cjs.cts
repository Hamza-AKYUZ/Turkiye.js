import lib = require("turkiye.js");
import tcknModule = require("turkiye.js/tckn");

const error = new lib.TurkiyeError("EMPTY", "x");
const code: lib.ErrorCode = error.code;
const result: lib.Result<number> = { ok: false, code: "RANGE", message: "x" };
lib.setMessages({ LENGTH: "{label}" });

const id: tcknModule.Tckn = lib.tckn.parse("10000000146");
const valid: boolean = tcknModule.isValid(id) && lib.iban.isValid("TR330006100519786457841326");
const network: lib.card.CardBrand | null = lib.card.brand("9792");

void [code, result, valid, network];
