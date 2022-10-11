import { z } from 'zod';
import { FormiDefValidateFn } from './FormiDef';

/**
 * Extened zod
 */
export const zx = {
  ...z,
  chain,
  validate,
  parse,
};

export type ZodIssueInfos = {
  kind: z.ZodIssueCode;
  message: string;
};

/**
 * Create a validation function from a zod schema
 */
export function validate<Input, Value, Issue = z.ZodIssue>(
  schema: z.Schema<Value, z.ZodTypeDef, Input>
): FormiDefValidateFn<any, Input, Value, Issue | z.ZodIssue> {
  return (value, { issues }) => {
    const res = parse(schema, value);
    if (res.success) {
      return res.value;
    }
    res.issues.forEach((issue) => {
      issues.addIssue(issue);
    });
    throw issues;
  };
}

/**
 * Parse a zod schema and `addIssue` if parsing fails
 */
export function parse<Value>(
  schema: z.Schema<Value, z.ZodTypeDef, any>,
  value: unknown
): { success: true; value: Value } | { success: false; issues: Array<z.ZodIssue> } {
  const res = schema.safeParse(value);
  if (res.success) {
    return { success: true, value: res.data };
  }
  return { success: false, issues: res.error.issues };
}

type S<I, O> = z.Schema<O, z.ZodTypeDef, I>;

/**
 * Generate types with this line
 * copy((arr = num => Array.from({ length: num }, (_, i) => i), arr(10).map(i => i + 2).map(i => `// prettier-ignore\nexport function zodChain<${arr(i + 1).map(j => `V${j}`).join(', ')}>(${arr(i).map(j => `s${j}: S<V${j}, V${j+1}>`).join(', ')}): S<V0, V${i}>;`).join('\n')))
 */
// prettier-ignore
export function chain<V0, V1, V2>(s0: S<V0, V1>, s1: S<V1, V2>): S<V0, V2>;
// prettier-ignore
export function chain<V0, V1, V2, V3>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>): S<V0, V3>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>): S<V0, V4>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>): S<V0, V5>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5, V6>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>, s5: S<V5, V6>): S<V0, V6>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5, V6, V7>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>, s5: S<V5, V6>, s6: S<V6, V7>): S<V0, V7>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5, V6, V7, V8>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>, s5: S<V5, V6>, s6: S<V6, V7>, s7: S<V7, V8>): S<V0, V8>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5, V6, V7, V8, V9>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>, s5: S<V5, V6>, s6: S<V6, V7>, s7: S<V7, V8>, s8: S<V8, V9>): S<V0, V9>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>, s5: S<V5, V6>, s6: S<V6, V7>, s7: S<V7, V8>, s8: S<V8, V9>, s9: S<V9, V10>): S<V0, V10>;
// prettier-ignore
export function chain<V0, V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(s0: S<V0, V1>, s1: S<V1, V2>, s2: S<V2, V3>, s3: S<V3, V4>, s4: S<V4, V5>, s5: S<V5, V6>, s6: S<V6, V7>, s7: S<V7, V8>, s8: S<V8, V9>, s9: S<V9, V10>, s10: S<V10, V11>): S<V0, V11>;
export function chain(...schemas: Array<S<any, any>>): S<any, any> {
  const [first, ...rest] = schemas;
  return rest.reduce((acc, schema) => {
    return acc.transform((val, ctx) => {
      const parsed = schema.safeParse(val);
      if (parsed.success) {
        return parsed.data;
      }
      parsed.error.errors.forEach((err) => ctx.addIssue(err));
      return z.NEVER;
    }) as any;
  }, first);
}
