import { formatMessage } from "./messages.ts";
import type { Result } from "./result.ts";

/**
 * Standard Schema v1 arayüzü (https://standardschema.dev). Bu arayüzü
 * destekleyen form ve doğrulama kütüphaneleriyle doğrudan kullanılabilir.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  interface Props<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output> | undefined;
  }

  type Result<Output> = SuccessResult<Output> | FailureResult;

  interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }

  interface FailureResult {
    readonly issues: ReadonlyArray<Issue>;
  }

  interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }

  interface PathSegment {
    readonly key: PropertyKey;
  }

  interface Types<Input = unknown, Output = Input> {
    readonly input: Input;
    readonly output: Output;
  }
}

/** @internal */
export interface SchemaOptions<Input, Output> {
  readonly label: string;
  readonly accept: (value: unknown) => Input | null;
  readonly validate: (value: Input) => Result<Output>;
}

/** @internal */
export function createSchema<Input, Output>(
  options: SchemaOptions<Input, Output>,
): StandardSchemaV1<Input, Output> {
  return Object.freeze({
    "~standard": Object.freeze({
      version: 1 as const,
      vendor: "turkiye.js",
      validate(value: unknown): StandardSchemaV1.Result<Output> {
        const input = options.accept(value);
        if (input === null) {
          return { issues: [{ message: formatMessage("FORMAT", { label: options.label }) }] };
        }
        const result = options.validate(input);
        return result.ok ? { value: result.value } : { issues: [{ message: result.message }] };
      },
    }),
  });
}
