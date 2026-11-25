import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { toInput } from "./input.ts";
import { resetMessages, setMessages } from "./messages.ts";
import { failure, type Result, success } from "./result.ts";
import { createSchema } from "./schema.ts";

afterEach(() => resetMessages());

function validateOk(value: string): Result<"ok"> {
  return value === "ok" ? success("ok") : failure("FORMAT", { label: "Test" });
}

const schema = createSchema({
  label: "Test",
  accept: (value) => toInput(value),
  validate: validateOk,
});

describe("createSchema", () => {
  it("Standard Schema v1 alanlarını taşır", () => {
    const props = schema["~standard"];
    assert.equal(props.version, 1);
    assert.equal(props.vendor, "turkiye.js");
    assert.equal(typeof props.validate, "function");
  });

  it("geçerli girdide value döner", () => {
    assert.deepEqual(schema["~standard"].validate("ok"), { value: "ok" });
  });

  it("geçersiz girdide doğrulayıcının mesajıyla issue döner", () => {
    assert.deepEqual(schema["~standard"].validate("nope"), { issues: [{ message: "Test biçimi geçersiz" }] });
  });

  it("kabul edilmeyen türde FORMAT issue döner", () => {
    for (const value of [42, null, undefined, {}]) {
      assert.deepEqual(schema["~standard"].validate(value), { issues: [{ message: "Test biçimi geçersiz" }] });
    }
  });

  it("tür hatası mesajı da setMessages'e uyar", () => {
    setMessages({ FORMAT: "{label} is invalid" });
    assert.deepEqual(schema["~standard"].validate(42), { issues: [{ message: "Test is invalid" }] });
  });

  it("dondurulmuştur", () => {
    assert.ok(Object.isFrozen(schema));
    assert.ok(Object.isFrozen(schema["~standard"]));
  });
});
