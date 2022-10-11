import { z } from 'zod';
import * as t from './types';
import { zx } from './zx';

export const field = {
  value<Value, Issue>(validate: t.FieldValidateFn_Value<Value, Issue>): t.Field_Value<Value, Issue> {
    return { kind: 'Value', validate, [t.FORMI_INTERNAL]: {} as any };
  },
  multiple<Value, Issue>(validate: t.FieldValidateFn_Multiple<Value, Issue>): t.Field_Multiple<Value, Issue> {
    return { kind: 'Multiple', validate, [t.FORMI_INTERNAL]: {} as any };
  },
  validate<Child extends t.FieldAny, Value, Issue>(
    child: Child,
    validate: t.FieldValidateFn_Validate<Child, Value, Issue>
  ): t.Field_Validate<Child, Value, Issue> {
    return { kind: 'Validate', child, validate, [t.FORMI_INTERNAL]: {} as any };
  },
  object<Children extends Record<string, t.FieldAny>, Issue>(children: Children): t.Field_Object<Children, Issue> {
    return { kind: 'Object', children, [t.FORMI_INTERNAL]: {} as any };
  },
  array<Children extends Array<t.FieldAny>, Issue>(children: Children): t.Field_Array<Children, Issue> {
    return { kind: 'Array', children, [t.FORMI_INTERNAL]: {} as any };
  },
  withIssue<Issue>() {
    return {
      value<Validate extends t.FieldValidateFn_Value<any, Issue>>(validate: Validate): t.Field_Value<ReturnType<Validate>, Issue> {
        return { kind: 'Value', validate, [t.FORMI_INTERNAL]: {} as any };
      },
      multiple<Validate extends t.FieldValidateFn_Multiple<any, Issue>>(validate: Validate): t.Field_Multiple<ReturnType<Validate>, Issue> {
        return { kind: 'Multiple', validate, [t.FORMI_INTERNAL]: {} as any };
      },
      validate<Child extends t.FieldAny, Validate extends t.FieldValidateFn_Validate<Child, any, Issue>>(
        child: Child,
        validate: Validate
      ): t.Field_Validate<Child, ReturnType<Validate>, Issue> {
        return { kind: 'Validate', child, validate, [t.FORMI_INTERNAL]: {} as any };
      },
      object<Children extends Record<string, t.FieldAny>>(children: Children): t.Field_Object<Children, Issue> {
        return { kind: 'Object', children, [t.FORMI_INTERNAL]: {} as any };
      },
      array<Children extends Array<t.FieldAny>>(children: Children): t.Field_Array<Children, Issue> {
        return { kind: 'Array', children, [t.FORMI_INTERNAL]: {} as any };
      },
    };
  },
  zx: {
    value<Value>(schema: z.Schema<Value, z.ZodTypeDef, FormDataEntryValue>): t.Field_Value<Value, z.ZodIssue> {
      const validate = zx.validate<FormDataEntryValue, Value, z.ZodIssue>(schema);
      return { kind: 'Value', validate, [t.FORMI_INTERNAL]: {} as any };
    },
    multiple<Value>(schema: z.Schema<Value, z.ZodTypeDef, Array<FormDataEntryValue>>): t.Field_Multiple<Value, z.ZodIssue> {
      const validate = zx.validate<Array<FormDataEntryValue>, Value, z.ZodIssue>(schema);
      return { kind: 'Multiple', validate, [t.FORMI_INTERNAL]: {} as any };
    },
    withIssue<Issue>() {
      return {
        value<Value>(schema: z.Schema<Value, z.ZodTypeDef, FormDataEntryValue>): t.Field_Value<Value, Issue | z.ZodIssue> {
          const validate = zx.validate<FormDataEntryValue, Value, Issue>(schema);
          return { kind: 'Value', validate, [t.FORMI_INTERNAL]: {} as any };
        },
        multiple<Value>(schema: z.Schema<Value, z.ZodTypeDef, Array<FormDataEntryValue>>): t.Field_Multiple<Value, Issue | z.ZodIssue> {
          const validate = zx.validate<Array<FormDataEntryValue>, Value, Issue | z.ZodIssue>(schema);
          return { kind: 'Multiple', validate, [t.FORMI_INTERNAL]: {} as any };
        },
      };
    },
  },
};
