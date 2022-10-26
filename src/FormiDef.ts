import { z } from 'zod';
import { FormiIssue } from './types';

const FORMI_DEF_INTERNAL = Symbol('FORMI_DEF_INTERNAL');

export type FormValue = FormDataEntryValue | Array<FormDataEntryValue>;

export type FormiDefSchema<Value, FormValue> = z.Schema<Value, z.ZodTypeDef, FormValue>;

// Note: validate can return success false with no issues to signal that the
// validation is not applicable to the current form state.
export type FormiDefValidateResult<Value, Issue> =
  | { success: true; value: Value }
  | { success: false; issue?: Issue; issues?: Array<Issue> };

export type FormiDefValidateFn<Input, Value, Issue> = (value: Input) => FormiDefValidateResult<Value, Issue>;

export interface FormiDef_Value<Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: { __value: Value; __issue: Issue };
  readonly kind: 'Value';
  readonly validate: FormiDefValidateFn<any, Value, Issue>;
}
export type FormiDef_ValueAny = FormiDef_Value<any, any>;

export interface FormiDef_Values<Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: { __value: Value; __issue: Issue };
  readonly kind: 'Values';
  readonly validate: FormiDefValidateFn<any, Value, Issue>;
}
export type FormiDef_ValuesAny = FormiDef_Values<any, any>;

export interface FormiDef_Repeat<Children extends FormiDefAny, Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: { __value: Value; __issue: Issue };
  readonly kind: 'Repeat';
  readonly children: Children;
  readonly validate: FormiDefValidateFn<any, Value, Issue>;
  readonly initialCount: number;
}
export type FormiDef_RepeatAny = FormiDef_Repeat<any, any, any>;

export interface FormiDef_Object<Children extends Record<string, any>, Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: { __value: Value; __issue: Issue };
  readonly kind: 'Object';
  readonly children: Children;
  readonly validate: FormiDefValidateFn<any, Value, Issue>;
}
export type FormiDefValueOf_Object<Children extends Record<string, any>> = { [K in keyof Children]: FormiDefValueOf<Children[K]> };
export type FormiDef_ObjectAny = FormiDef_Object<Record<string, any>, any, any>;

export type FormiDefAny = FormiDef_ValueAny | FormiDef_ValuesAny | FormiDef_RepeatAny | FormiDef_ObjectAny;

export type FormiDefValueOf<Def extends FormiDefAny> = Def[typeof FORMI_DEF_INTERNAL]['__value'];
export type FormiDefIssueOf<Def extends FormiDefAny> = Def[typeof FORMI_DEF_INTERNAL]['__issue'];

export type FormiDef_Repeat_Options<Children extends FormiDefAny, Value, Issue> = {
  field: Children;
  validate: FormiDefValidateFn<FormiDefValueOf<Children> | null, Value, Issue>;
  initialCount?: number;
};

export const FormiDef = (() => {
  const field = withIssue<FormiIssue>();

  return {
    field,
    withIssue,
    utils: {
      stringValidator,
      numberValidator,
      zodValidator,
    },
  } as const;

  function withIssue<BaseIssue>() {
    return {
      value,
      values,
      object,
      repeat,
      repeatAdvanced,
      string,
      zodString,
      objectAdvanced,
      number,
      zodNumber,
    } as const;

    function value<Value, Issue = BaseIssue>(
      validate: FormiDefValidateFn<FormDataEntryValue | null, Value, Issue>
    ): FormiDef_Value<Value, Issue> {
      return { kind: 'Value', validate, [FORMI_DEF_INTERNAL]: {} as any };
    }

    function values<Value, Issue = BaseIssue>(
      validate: FormiDefValidateFn<Array<FormDataEntryValue> | null, Value, Issue>
    ): FormiDef_Values<Value, Issue> {
      return { kind: 'Values', validate, [FORMI_DEF_INTERNAL]: {} as any };
    }

    function objectAdvanced<Children extends Record<string, any>, Value, Issue = BaseIssue>(
      children: Children,
      validate: FormiDefValidateFn<FormiDefValueOf_Object<Children> | null, Value, Issue>
    ): FormiDef_Object<Children, Value, Issue> {
      return { kind: 'Object', children, [FORMI_DEF_INTERNAL]: {} as any, validate };
    }

    function object<Children extends Record<string, any>, Issue = BaseIssue>(
      children: Children
    ): FormiDef_Object<Children, FormiDefValueOf_Object<Children>, Issue> {
      return {
        kind: 'Object',
        children,
        [FORMI_DEF_INTERNAL]: {} as any,
        validate: (value) => (value === null ? { success: false } : { success: true, value }),
      };
    }

    function repeatAdvanced<Children extends FormiDefAny, Value, Issue = BaseIssue>(
      options: FormiDef_Repeat_Options<Children, Value, Issue>
    ): FormiDef_Repeat<Children, Value, Issue> {
      return {
        kind: 'Repeat',
        children: options.field,
        [FORMI_DEF_INTERNAL]: {} as any,
        validate: options.validate,
        initialCount: options.initialCount ?? 0,
      };
    }

    function repeat<Children extends FormiDefAny, Issue = BaseIssue>(
      field: Children,
      initialCount = 0
    ): FormiDef_Repeat<Children, Array<FormiDefValueOf<Children>>, Issue> {
      return {
        kind: 'Repeat',
        children: field,
        [FORMI_DEF_INTERNAL]: {} as any,
        validate: (value) => (value === null ? { success: false } : { success: true, value }),
        initialCount,
      };
    }

    function string<Value, Issue = BaseIssue>(validate?: FormiDefValidateFn<string, Value, Issue>) {
      return value<Value, Issue | FormiIssue>(stringValidator<Value, Issue>(validate));
    }

    function zodString<Issue = BaseIssue>(schema: z.Schema<string>) {
      return value<string, Issue | FormiIssue>(stringValidator<string, FormiIssue>(zodValidator<string>(schema)));
    }

    function number<Value, Issue = BaseIssue>(validate?: FormiDefValidateFn<number | null, Value, Issue>) {
      return value<Value, Issue | FormiIssue>(numberValidator<Value, Issue>(validate));
    }

    function zodNumber<Value extends number | null, Issue = BaseIssue>(schema: z.Schema<Value>) {
      return value<Value, Issue | FormiIssue>(numberValidator<Value, FormiIssue>(zodValidator<Value>(schema)));
    }

    // function file(validate: FormiDefValidateFn<>) {
    //   return value<string>(createStringValidator(schema));
    // }
  }

  function stringValidator<Value, Issue>(
    validate?: FormiDefValidateFn<string, Value, Issue>
  ): FormiDefValidateFn<FormDataEntryValue | null, Value, Issue | FormiIssue> {
    return (value) => {
      if (value === null) {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      if (typeof value !== 'string') {
        return { success: false, issue: { kind: 'UnexpectedFile' } };
      }
      if (!validate) {
        return { success: true, value } as any;
      }
      return validate(value);
    };
  }

  function numberValidator<Value, Issue>(
    validate?: FormiDefValidateFn<number | null, Value, Issue>
  ): FormiDefValidateFn<FormDataEntryValue | null, Value, Issue | FormiIssue> {
    return (value) => {
      if (value === null) {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      if (typeof value !== 'string') {
        return { success: false, issue: { kind: 'UnexpectedFile' } };
      }
      const numberValue = value === '' ? null : Number(value);
      if (Number.isNaN(numberValue)) {
        return { success: false, issue: { kind: 'InvalidNumber', value } };
      }
      if (!validate) {
        return { success: true, value: numberValue } as any;
      }
      return validate(numberValue);
    };
  }

  function zodValidator<T>(schema: z.Schema<T>): FormiDefValidateFn<any, T, FormiIssue> {
    return (value) => {
      const result = schema.safeParse(value);
      if (result.success) {
        return { success: true, value };
      }
      const issues = result.error.issues.map((issue): FormiIssue => ({ kind: 'ZodIssue', issue }));
      if (issues.length === 1) {
        return { success: false, issue: issues[0] };
      }
      return { success: false, issues: issues };
    };
  }
})();
