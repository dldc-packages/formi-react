import { z } from 'zod';
import { FormiFieldTree, FormiFieldTreeValue } from './FormiFieldTree';
import {
  FormiIssue,
  FormiIssueBase,
  FormiIssueNonEmptyFile,
  FormiIssueNotFile,
  FormiIssueNotString,
  FormiIssueNumber,
  FormiIssueZod,
} from './FormiIssue';
import { FormiKey } from './FormiKey';

const FIELD_INTERNAL = Symbol('FIELD_INTERNAL');

export type ValidateSuccess<Value> = { success: true; value: Value };
export type ValidateFailure<Issue> = { success: false; issue?: Issue; issues?: Array<Issue> };
export type ValidateResult<Value, Issue> = ValidateSuccess<Value> | ValidateFailure<Issue>;

export type ValidateFn<Input, Value, Issue> = (value: Input) => ValidateResult<Value, Issue>;

export type ChildrenUpdateFn<Children> = (prev: Children) => Children;

export type FormiFieldAny = FormiField<any, any, any>;

export type FormiFieldInput<F extends FormiFieldAny> = F[typeof FIELD_INTERNAL]['__input'];
export type FormiFieldValue<F extends FormiFieldAny> = F[typeof FIELD_INTERNAL]['__value'];
export type FormiFieldIssue<F extends FormiFieldAny> = F[typeof FIELD_INTERNAL]['__issue'];

export type FormiFieldKind = 'Value' | 'Values' | 'Group';

export interface FormiField<Value, Issue = FormiIssue, Children extends FormiFieldTree = null, Input = unknown> {
  readonly [FIELD_INTERNAL]: {
    readonly validateFn: ValidateFn<any, Value, Issue>;
    readonly __input: Input;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly kind: FormiFieldKind;
  readonly children: Children;
  readonly key: FormiKey;

  readonly validate: <NextValue = Value, NextIssue = never>(
    validateFn: ValidateFn<Value, NextValue, Issue | NextIssue>
  ) => FormiField<NextValue, Issue | NextIssue, Children, Input>;

  readonly zodValidate: <NextValue = Value>(schema: z.Schema<NextValue>) => FormiField<NextValue, Issue | FormiIssueZod, Children, Input>;

  readonly withChildren: (children: Children | ChildrenUpdateFn<Children>) => FormiField<Value, Issue, Children, Input>;
}

export const FormiField = (() => {
  return {
    utils: {
      getValidate,
      zodValidator,
      isFormiField,
      isNotNull,
      isNotFile,
      isNumber,
      isDefined,
    },
    // primitives
    value,
    values,
    group,
    // common
    string,
    optionalString,
    number,
    optionalNumber,
    checkbox,
    file,
    nonEmptyfile,
  } as const;

  function create<Value, Issue, Children extends FormiFieldTree, Input>(
    kind: FormiFieldKind,
    key: FormiKey,
    children: Children,
    validateFn: ValidateFn<any, Value, Issue> = (value) => ({
      success: true,
      value,
    })
  ): FormiField<Value, Issue, Children, Input> {
    const currentValidateFn = validateFn;

    return {
      [FIELD_INTERNAL]: {
        __input: {} as Input,
        __value: {} as Value,
        __issue: {} as Issue,
        validateFn,
      },
      kind,
      children,
      key,
      validate,
      zodValidate,
      withChildren,
    };

    function validate<NextValue = Value, NextIssue = never>(
      validateFn: ValidateFn<Value, NextValue, Issue | NextIssue>
    ): FormiField<NextValue, Issue | NextIssue, Children, Input> {
      const nextValidate = (input: any) => {
        const prev = currentValidateFn(input);
        if (!prev.success) {
          return prev;
        }
        return validateFn(prev.value);
      };
      return create(kind, key, children, nextValidate);
    }

    function withChildren(update: Children | ChildrenUpdateFn<Children>): FormiField<Value, Issue, Children, Input> {
      const nextChildren = typeof update === 'function' ? update(children) : update;
      return create(kind, key, nextChildren, validateFn);
    }

    function zodValidate<NextValue = Value>(schema: z.Schema<NextValue>): FormiField<NextValue, Issue | FormiIssueZod, Children, Input> {
      return validate(zodValidator(schema));
    }
  }

  // primitives

  function value(): FormiField<FormDataEntryValue | null, FormiIssueBase, null, FormDataEntryValue | null> {
    return create('Value', FormiKey(), null);
  }

  function values(): FormiField<Array<FormDataEntryValue> | null, FormiIssueBase, null, Array<FormDataEntryValue> | null> {
    return create('Values', FormiKey(), null);
  }

  function group<Children extends FormiFieldTree>(
    children: Children
  ): FormiField<FormiFieldTreeValue<Children>, FormiIssueBase, Children, FormiFieldTreeValue<Children>> {
    return create('Group', FormiKey(), children);
  }

  // common

  function string<Issue = never>(): FormiField<string, FormiIssueNotFile | Issue, null> {
    return value().validate(isNotFile).validate(isNotNull);
  }

  function optionalString<Issue = never>(): FormiField<string | null, FormiIssueNotFile | Issue, null> {
    return value().validate(isNotFile);
  }

  function number<Issue = never>(): FormiField<number, FormiIssueNotFile | FormiIssueNumber | Issue, null> {
    return string().validate(isNumber).validate(isNotNull);
  }

  function optionalNumber<Issue = never>(): FormiField<null | number, FormiIssueNotFile | FormiIssueNumber | Issue, null> {
    return string().validate(isNumber);
  }

  function checkbox<Issue = never>(): FormiField<boolean, Issue | FormiIssueNotFile, null> {
    return value().validate(isNotFile).validate(isDefined);
  }

  function file<Issue = never>(): FormiField<File, FormiIssueNotString | Issue, null> {
    return value().validate<File, FormiIssueNotString>((entry) => {
      if (entry === null) {
        return { success: false, issue: { kind: 'MissingField' } };
      }
      if (typeof entry === 'string') {
        return { success: false, issue: { kind: 'UnexpectedString' } };
      }
      return { success: true, value: entry };
    });
  }

  function nonEmptyfile<Issue = never>(): FormiField<File, FormiIssueNotString | FormiIssueNonEmptyFile | Issue, null> {
    return file().validate((val) => {
      if (val.size === 0) {
        return failure<FormiIssueNonEmptyFile>({ kind: 'EmptyFile' });
      }
      return success(val);
    });
  }

  // utils

  function getValidate(field: FormiFieldAny): ValidateFn<any, any, any> {
    return field[FIELD_INTERNAL].validateFn;
  }

  function isFormiField(field: any): field is FormiField<any, any, any> {
    return field && field[FIELD_INTERNAL];
  }

  function zodValidator<T>(schema: z.Schema<T>): ValidateFn<any, T, FormiIssueZod> {
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

  function isNotNull<Value>(input: Value | null): ValidateResult<Value, FormiIssueBase> {
    if (input === null) {
      return failure<FormiIssueBase>({ kind: 'MissingField' });
    }
    return success<Value>(input);
  }

  function isNotFile<Value>(input: Value | File): ValidateResult<Value, FormiIssueNotFile> {
    if (input instanceof File) {
      return failure<FormiIssueNotFile>({ kind: 'UnexpectedFile' });
    }
    return success<Value>(input);
  }

  function isNumber(input: string): ValidateResult<number | null, FormiIssueNumber> {
    if (input === '' || input === null) {
      return success<number | null>(null);
    }
    const numberValue = Number(input);
    if (Number.isNaN(numberValue)) {
      return failure<FormiIssueNumber>({ kind: 'InvalidNumber', value: input });
    }
    return success<number>(numberValue);
  }

  function isDefined(input: any): ValidateResult<boolean, FormiIssueBase> {
    if (input === null || input === undefined) {
      return success(false);
    }
    return success(true);
  }
})();

export function success<Value>(value: Value): ValidateSuccess<Value> {
  return { success: true, value };
}

export function failure<Issue>(issue?: Issue | Array<Issue>): ValidateFailure<Issue> {
  if (issue === undefined) {
    return { success: false };
  }
  if (Array.isArray(issue)) {
    return { success: false, issues: issue };
  }
  return { success: false, issue };
}
