import { z } from 'zod';

const FORMI_DEF_INTERNAL = Symbol('FORMI_DEF_INTERNAL');

export type FormValue = FormDataEntryValue | Array<FormDataEntryValue>;

export type FormiDefSchema<Value, FormValue> = z.Schema<Value, z.ZodTypeDef, FormValue>;

// Note: validate can return success false with no issues to signal that the
// validation is not applicable to the current form state.
export type FormiDefValidateResult<Value, Issue> =
  | { success: true; value: Value }
  | { success: false; issue?: Issue; issues?: Array<Issue> };

export type FormiDefValidateFn<Input, Value, Issue> = (value: Input) => FormiDefValidateResult<Value, Issue>;

export type FormiIssueBase = { kind: 'FieldNotMounted' } | { kind: 'ValidationError'; error: unknown } | { kind: 'MissingField' };

export type FormiIssueString = FormiIssueBase | { kind: 'UnexpectedFile' };
export type FormiIssueFile = FormiIssueBase | { kind: 'UnexpectedString' } | { kind: 'MissingField' };
export type FormiIssueNumber = FormiIssueString | { kind: 'InvalidNumber'; value: string };
export type FormiIssueNonEmptyFile = FormiIssueFile | { kind: 'EmptyFile' };

export type FormiIssueZod = { kind: 'ZodIssue'; issue: z.ZodIssue };

export type FormiIssue = FormiIssueBase | FormiIssueString | FormiIssueFile | FormiIssueNumber | FormiIssueNonEmptyFile | FormiIssueZod;

export interface FormiDef_Value<Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: {
    readonly validateFn: FormiDefValidateFn<any, Value, Issue>;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly kind: 'Value';
  readonly validate: <NextValue = Value, NextIssue = never>(
    validateFn: FormiDefValidateFn<Value, NextValue, Issue | NextIssue>
  ) => FormiDef_Value<NextValue, Issue | NextIssue>;
}
export type FormiDef_ValueAny = FormiDef_Value<any, any>;

export interface FormiDef_Values<Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: {
    readonly validateFn: FormiDefValidateFn<any, Value, Issue>;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly kind: 'Values';
  readonly validate: <NextValue = Value, NextIssue = never>(
    validateFn: FormiDefValidateFn<Value, NextValue, Issue | NextIssue>
  ) => FormiDef_Values<NextValue, Issue | NextIssue>;
}
export type FormiDef_ValuesAny = FormiDef_Values<any, any>;

export interface FormiDef_Repeat<Children extends FormiDefAny, Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: {
    readonly validateFn: FormiDefValidateFn<any, Value, Issue>;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly kind: 'Repeat';
  readonly children: Children;
  readonly initialCount: number;
  readonly validate: <NextValue = Value, NextIssue = never>(
    validateFn: FormiDefValidateFn<Value, NextValue, Issue | NextIssue>
  ) => FormiDef_Repeat<Children, NextValue, Issue | NextIssue>;
}
export type FormiDef_RepeatAny = FormiDef_Repeat<any, any, any>;

export interface FormiDef_Object<Children extends Record<string, any>, Value, Issue> {
  readonly [FORMI_DEF_INTERNAL]: {
    readonly validateFn: FormiDefValidateFn<any, Value, Issue>;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly kind: 'Object';
  readonly children: Children;
  readonly validate: <NextValue = Value, NextIssue = never>(
    validateFn: FormiDefValidateFn<Value, NextValue, Issue | NextIssue>
  ) => FormiDef_Object<Children, NextValue, Issue | NextIssue>;
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

export function getFormiDefValidateFn(def: FormiDefAny): FormiDefValidateFn<any, any, any> {
  return def[FORMI_DEF_INTERNAL].validateFn;
}

export const FormiDef = (() => {
  return {
    zodValidator,
    value,
    values,
    object,
    repeat,
    string,
    file,
    nonEmptyfile,
    zodString,
    zodNumber,
  } as const;

  function value<Issue = never>(): FormiDef_Value<FormDataEntryValue | null, FormiIssueBase | Issue> {
    return createWithValidate({ kind: 'Value' });
  }

  function values<Issue = never>(): FormiDef_Values<Array<FormDataEntryValue> | null, FormiIssueBase | Issue> {
    return createWithValidate({ kind: 'Values' });
  }

  function object<Children extends Record<string, any>>(
    children: Children
  ): FormiDef_Object<Children, FormiDefValueOf_Object<Children>, FormiIssueBase> {
    return createWithValidate({ kind: 'Object', children });
  }

  function repeat<Children extends FormiDefAny>(
    field: Children,
    initialCount = 0
  ): FormiDef_Repeat<Children, Array<FormiDefValueOf<Children>>, FormiIssueBase> {
    return createWithValidate({ kind: 'Repeat', children: field, initialCount });
  }

  function string<Issue = never>(): FormiDef_Value<string, FormiIssueString | Issue> {
    return value().validate<string, FormiIssueString>((entry) => {
      if (entry === null) {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      if (typeof entry !== 'string') {
        return { success: false, issue: { kind: 'UnexpectedFile' } };
      }
      return { success: true, value: entry };
    });
  }

  function number<Issue = never>(): FormiDef_Value<number, FormiIssueNumber | Issue> {
    return string().validate<number, FormiIssueNumber>((entry) => {
      if (entry === '') {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      const numberValue = Number(entry);
      if (Number.isNaN(numberValue)) {
        return { success: false, issue: { kind: 'InvalidNumber', value: entry } };
      }
      return { success: true, value: numberValue };
    });
  }

  function zodString<T, Issue = never>(schema: z.Schema<T>): FormiDef_Value<T, FormiIssueString | FormiIssueZod | Issue> {
    return string().validate(zodValidator(schema));
  }

  function zodNumber<T, Issue = never>(schema: z.Schema<T>): FormiDef_Value<T, FormiIssueNumber | FormiIssueZod | Issue> {
    return number().validate(zodValidator(schema));
  }

  function file<Issue = never>(): FormiDef_Value<File, FormiIssueFile | Issue> {
    return value().validate<File, FormiIssueFile>((entry) => {
      if (entry === null) {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      if (typeof entry === 'string') {
        return { success: false, issue: { kind: 'UnexpectedString' } };
      }
      return { success: true, value: entry };
    });
  }

  function nonEmptyfile<Issue = never>(): FormiDef_Value<File, FormiIssueNonEmptyFile | Issue> {
    return file().validate((val) => {
      if (val.size === 0) {
        return { success: false, issue: { kind: 'EmptyFile' } };
      }
      return { success: true, value: val };
    });
  }

  function createWithValidate<T extends FormiDefAny>(
    def: Omit<T, 'validate' | typeof FORMI_DEF_INTERNAL>,
    validateFn: (value: any) => any = (value) => ({ success: true, value })
  ): T {
    const res = {
      ...def,
      [FORMI_DEF_INTERNAL]: {
        validateFn,
        __value: null as any,
        __issue: null as any,
      },
      validate(nextValidateFn: (value: any) => any) {
        const nextValidate = (value: any) => {
          const res = validateFn(value);
          if (!res.success) {
            return res;
          }
          return nextValidateFn(res.value);
        };
        return createWithValidate(res, nextValidate);
      },
    };
    return res as any;
  }

  function zodValidator<T>(schema: z.Schema<T>): FormiDefValidateFn<any, T, FormiIssueZod> {
    return (value) => {
      const result = schema.safeParse(value);
      if (result.success) {
        return { success: true, value: result.data };
      }
      const issues = result.error.issues.map((issue): FormiIssueZod => ({ kind: 'ZodIssue', issue }));
      if (issues.length === 1) {
        return { success: false, issue: issues[0] };
      }
      return { success: false, issues: issues };
    };
  }
})();
