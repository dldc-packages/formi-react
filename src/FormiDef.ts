import { z } from 'zod';
import { FormiFieldIssues } from './FormiFieldIssues';
import * as f from './FormiField';
import { zx } from './zx';

const FORMI_DEF_INTERNAL = Symbol('FORMI_DEF_INTERNAL');

export type FormValue = FormDataEntryValue | Array<FormDataEntryValue>;

export type FormiDefSchema<Value, FormValue> = z.Schema<Value, z.ZodTypeDef, FormValue>;

export type FormiDefValidateFnContext<F extends f.FormiFieldAny, Issue> = {
  issues: FormiFieldIssues<Issue>;
  field: F;
};

export type FormiDefValidateFn<FormiField extends f.FormiFieldAny, Input, Value, Issue> = (
  value: Input,
  context: FormiDefValidateFnContext<FormiField, Issue>
) => Value;

export type FormiDefValidateFn_Value<Value, Issue> = FormiDefValidateFn<f.FormiField_Value<Value, Issue>, FormDataEntryValue, Value, Issue>;

export type FormiDefValidateFn_Multiple<Value, Issue> = FormiDefValidateFn<
  f.FormiField_Multiple<Value, Issue>,
  Array<FormDataEntryValue>,
  Value,
  Issue
>;

export type FormiDefValidateFn_Validate<Child extends FormiDefAny, Value, Issue> = FormiDefValidateFn<
  f.FormiField_Validate<Child, Value, Issue>,
  FormiDefValueOf<Child>,
  Value,
  Issue
>;

export interface FormiDefBase<Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: { __value: Value; __issue: Issue };
}
export type FormiDefBaseAny = FormiDefBase<any, any>;

export interface FormiDef_Value<Value, Issue> extends FormiDefBase<Value, Issue> {
  readonly kind: 'Value';
  readonly validate: FormiDefValidateFn<f.FormiField_Value<Value, Issue>, FormDataEntryValue, Value, Issue>;
}
export type FormiDef_ValueAny = FormiDef_Value<any, any>;

export interface FormiDef_Multiple<Value, Issue> extends FormiDefBase<Value, Issue> {
  readonly kind: 'Multiple';
  readonly validate: FormiDefValidateFn<f.FormiField_Multiple<Value, Issue>, Array<FormDataEntryValue>, Value, Issue>;
}
export type FormiDef_MultipleAny = FormiDef_Multiple<any, any>;

export interface FormiDef_Validate<Child extends FormiDefAny, Value, Issue> extends FormiDefBase<Value, Issue> {
  readonly kind: 'Validate';
  readonly child: Child;
  readonly validate: FormiDefValidateFn<f.FormiField_Validate<Child, Value, Issue>, FormiDefValueOf<Child>, Value, Issue>;
}
export type FormiDef_ValidateAny = FormiDef_Validate<FormiDefAny, any, any>;

export interface FormiDef_Object<Children extends Record<string, FormiDefAny>, Issue>
  extends FormiDefBase<FormiDefValueOf_Object<Children>, Issue> {
  readonly kind: 'Object';
  readonly children: Children;
}
export type FormiDefValueOf_Object<Children extends Record<string, FormiDefAny>> = { [K in keyof Children]: FormiDefValueOf<Children[K]> };
export type FormiDef_ObjectAny = FormiDef_Object<Record<string, FormiDefAny>, any>;

export interface FormiDef_Array<Children extends Array<FormiDefAny>, Issue> extends FormiDefBase<FormiDefValueOf_Array<Children>, Issue> {
  readonly kind: 'Array';
  readonly children: Children;
}
export type FormiDefValueOf_Array<Children extends Array<FormiDefAny>> = Children extends Array<infer Child>
  ? Child extends FormiDefAny
    ? Array<FormiDefValueOf<Child>>
    : never
  : never;
export type FormiDef_ArrayAny = FormiDef_Array<Array<FormiDefAny>, any>;

export type FormiDefAny = FormiDef_ValueAny | FormiDef_ValidateAny | FormiDef_MultipleAny | FormiDef_ArrayAny | FormiDef_ObjectAny;

export type FormiDefValueOf<Def extends FormiDefBaseAny> = Def[typeof FORMI_DEF_INTERNAL]['__value'];
export type FormiDefIssueOf<Def extends FormiDefBaseAny> = Def[typeof FORMI_DEF_INTERNAL]['__issue'];

export const def = {
  value<Value, Issue>(validate: FormiDefValidateFn_Value<Value, Issue>): FormiDef_Value<Value, Issue> {
    return { kind: 'Value', validate, [FORMI_DEF_INTERNAL]: {} as any };
  },
  multiple<Value, Issue>(validate: FormiDefValidateFn_Multiple<Value, Issue>): FormiDef_Multiple<Value, Issue> {
    return { kind: 'Multiple', validate, [FORMI_DEF_INTERNAL]: {} as any };
  },
  validate<Child extends FormiDefAny, Value, Issue>(
    child: Child,
    validate: FormiDefValidateFn_Validate<Child, Value, Issue>
  ): FormiDef_Validate<Child, Value, Issue> {
    return { kind: 'Validate', child, validate, [FORMI_DEF_INTERNAL]: {} as any };
  },
  object<Children extends Record<string, FormiDefAny>, Issue>(children: Children): FormiDef_Object<Children, Issue> {
    return { kind: 'Object', children, [FORMI_DEF_INTERNAL]: {} as any };
  },
  array<Children extends Array<FormiDefAny>, Issue>(children: Children): FormiDef_Array<Children, Issue> {
    return { kind: 'Array', children, [FORMI_DEF_INTERNAL]: {} as any };
  },
  withIssue<Issue>() {
    return {
      value<Validate extends FormiDefValidateFn_Value<any, Issue>>(validate: Validate): FormiDef_Value<ReturnType<Validate>, Issue> {
        return { kind: 'Value', validate, [FORMI_DEF_INTERNAL]: {} as any };
      },
      multiple<Validate extends FormiDefValidateFn_Multiple<any, Issue>>(
        validate: Validate
      ): FormiDef_Multiple<ReturnType<Validate>, Issue> {
        return { kind: 'Multiple', validate, [FORMI_DEF_INTERNAL]: {} as any };
      },
      validate<Child extends FormiDefAny, Validate extends FormiDefValidateFn_Validate<Child, any, Issue>>(
        child: Child,
        validate: Validate
      ): FormiDef_Validate<Child, ReturnType<Validate>, Issue> {
        return { kind: 'Validate', child, validate, [FORMI_DEF_INTERNAL]: {} as any };
      },
      object<Children extends Record<string, FormiDefAny>>(children: Children): FormiDef_Object<Children, Issue> {
        return { kind: 'Object', children, [FORMI_DEF_INTERNAL]: {} as any };
      },
      array<Children extends Array<FormiDefAny>>(children: Children): FormiDef_Array<Children, Issue> {
        return { kind: 'Array', children, [FORMI_DEF_INTERNAL]: {} as any };
      },
    };
  },
  zx: {
    value<Value>(schema: z.Schema<Value, z.ZodTypeDef, FormDataEntryValue>): FormiDef_Value<Value, z.ZodIssue> {
      const validate = zx.validate<FormDataEntryValue, Value, z.ZodIssue>(schema);
      return { kind: 'Value', validate, [FORMI_DEF_INTERNAL]: {} as any };
    },
    multiple<Value>(schema: z.Schema<Value, z.ZodTypeDef, Array<FormDataEntryValue>>): FormiDef_Multiple<Value, z.ZodIssue> {
      const validate = zx.validate<Array<FormDataEntryValue>, Value, z.ZodIssue>(schema);
      return { kind: 'Multiple', validate, [FORMI_DEF_INTERNAL]: {} as any };
    },
    withIssue<Issue>() {
      return {
        value<Value>(schema: z.Schema<Value, z.ZodTypeDef, FormDataEntryValue>): FormiDef_Value<Value, Issue | z.ZodIssue> {
          const validate = zx.validate<FormDataEntryValue, Value, Issue>(schema);
          return { kind: 'Value', validate, [FORMI_DEF_INTERNAL]: {} as any };
        },
        multiple<Value>(schema: z.Schema<Value, z.ZodTypeDef, Array<FormDataEntryValue>>): FormiDef_Multiple<Value, Issue | z.ZodIssue> {
          const validate = zx.validate<Array<FormDataEntryValue>, Value, Issue | z.ZodIssue>(schema);
          return { kind: 'Multiple', validate, [FORMI_DEF_INTERNAL]: {} as any };
        },
      };
    },
  },
};
