declare const brand: unique symbol;

/**
 * Doğrulanmış değerleri tip düzeyinde ayırt eder. Çalışma zamanında değer
 * değişmez.
 *
 * @example
 * type Tckn = Brand<string, "Tckn">;
 * function saveUser(id: Tckn) {}
 * saveUser("10000000146");     // tip hatası
 * saveUser(tckn.parse(input)); // geçerli
 */
export type Brand<T, B extends string> = T & { readonly [brand]: B };
