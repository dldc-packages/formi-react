import { z } from 'zod';
import { FormiFieldTree, FormiFieldTreeValue } from './FormiFieldTree';
import {
  FormiIssue,
  FormiIssueBase,
  FormiIssueNonEmptyFile,
  FormiIssueNotFile,
  FormiIssueNotString,
  FormiIssueNumber,
  FormiIssueSingle,
  FormiIssueZod,
} from './FormiIssue';
import { FormiKey } from './FormiKey';

const FIELD_INTERNAL = Symbol('FIELD_INTERNAL');
const FIELD_BUILDER_INTERNAL = Symbol('FIELD_BUILDER_INTERNAL');

export type InputBase<Children extends FormiFieldTree> = {
  values: Array<FormDataEntryValue>;
  children: FormiFieldTreeValue<Children>;
};

export type ValidateSuccess<Value> = { success: true; value: Value };
export type ValidateFailure<Issue> = { success: false; issue?: Issue; issues?: Array<Issue> };
export type ValidateResult<Value, Issue> = ValidateSuccess<Value> | ValidateFailure<Issue>;

export type ValidateFn<Input, Value, Issue> = (value: Input) => ValidateResult<Value, Issue>;

export type ChildrenUpdateFn<Children> = (prev: Children) => Children;

export interface FormiField<Value, Issue = FormiIssue, Children extends FormiFieldTree = null> {
  readonly [FIELD_INTERNAL]: {
    readonly builder: FormiFieldBuilder<Value, Issue, Children>;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly children: Children;
  readonly key: FormiKey;
  readonly validate: ValidateFn<InputBase<Children>, Value, Issue>;

  readonly withChildren: (children: Children | ChildrenUpdateFn<Children>) => FormiField<Value, Issue, Children>;
}

export type FormiFieldAny = FormiField<any, any, any>;

export type FormiFieldValue<F extends FormiFieldAny> = F[typeof FIELD_INTERNAL]['__value'];
export type FormiFieldIssue<F extends FormiFieldAny> = F[typeof FIELD_INTERNAL]['__issue'];
export type FormiFieldChildren<F extends FormiFieldAny> = F['children'];

export type FormiFieldFromBuilder<Builder extends FormiFieldBuilderAny> = FormiField<
  Builder[typeof FIELD_BUILDER_INTERNAL]['__value'],
  Builder[typeof FIELD_BUILDER_INTERNAL]['__issue'],
  Builder['children']
>;

export type FormiFieldBuilderAny = FormiFieldBuilder<any, any, any>;

export interface FormiFieldBuilder<Value, Issue = FormiIssue, Children extends FormiFieldTree = null> {
  readonly [FIELD_BUILDER_INTERNAL]: {
    readonly validateFn: ValidateFn<InputBase<Children>, Value, Issue>;
    readonly __value: Value;
    readonly __issue: Issue;
  };
  readonly children: Children;

  readonly validate: <NextValue = Value, NextIssue = never>(
    validateFn: ValidateFn<Value, NextValue, Issue | NextIssue>
  ) => FormiFieldBuilder<NextValue, Issue | NextIssue, Children>;
  readonly zodValidate: <NextValue = Value>(schema: z.Schema<NextValue>) => FormiFieldBuilder<NextValue, Issue | FormiIssueZod, Children>;
  readonly withIssue: <NextIssue>() => FormiFieldBuilder<Value, Issue | NextIssue, Children>;

  readonly use: () => FormiField<Value, Issue, Children>;
}

export const FormiField = (() => {
  const base: FormiFieldBuilder<InputBase<null>, FormiIssueBase, null> = createFieldBuilder(null, (input) => success(input));

  const value = base.validate(isSingleValue);
  const values = base.validate((input) => success(input.values));

  const optionalString = value.validate(isNotFile);
  const string = optionalString.validate(isNotNull);
  const optionalNumber = optionalString.validate(isNumber);
  const number = optionalNumber.validate(isNotNull);
  const checkbox = optionalString.validate(isDefined);

  const file = value.validate(isFile);
  const nonEmptyfile = file.validate(isNonEmptyFile);

  function group<Children extends FormiFieldTree>(
    children: Children
  ): FormiFieldBuilder<FormiFieldTreeValue<Children>, FormiIssueBase, Children> {
    return createFieldBuilder<FormiFieldTreeValue<Children>, FormiIssueBase, Children>(children, (input) => success(input.children));
  }

  return {
    utils: {
      isFormiField,
      getBuilder,
      zodValidator,
      isNotNull,
      isNotFile,
      isNumber,
      isDefined,
      isFile,
      isNonEmptyFile,
    },
    create: createFieldBuilder,
    value: () => value,
    values: () => values,
    string: () => string,
    optionalString: () => optionalString,
    number: () => number,
    optionalNumber: () => optionalNumber,
    checkbox: () => checkbox,
    file: () => file,
    nonEmptyfile: () => nonEmptyfile,

    group,
  } as const;

  function createField<Value, Issue, Children extends FormiFieldTree>(
    builder: FormiFieldBuilder<Value, Issue, Children>,
    key: FormiKey,
    children: Children
  ): FormiField<Value, Issue, Children> {
    return {
      [FIELD_INTERNAL]: {
        builder,
        __value: {} as Value,
        __issue: {} as Issue,
      },
      children,
      key,
      validate: builder[FIELD_BUILDER_INTERNAL].validateFn,
      withChildren: (update: Children | ChildrenUpdateFn<Children>) => {
        const nextChildren = typeof update === 'function' ? update(children) : update;
        return createField(builder, key, nextChildren);
      },
    };
  }

  function createFieldBuilder<Value, Issue, Children extends FormiFieldTree>(
    children: Children,
    validateFn: ValidateFn<InputBase<Children>, Value, Issue>
  ): FormiFieldBuilder<Value, Issue, Children> {
    const currentValidateFn = validateFn;

    const self: FormiFieldBuilder<Value, Issue, Children> = {
      [FIELD_BUILDER_INTERNAL]: {
        validateFn,
        __value: {} as Value,
        __issue: {} as Issue,
      },
      children,
      validate,
      zodValidate,
      withIssue,
      use,
    };
    return self;

    function use(): FormiField<Value, Issue, Children> {
      return createField(self, FormiKey(), children);
    }

    function withIssue<NextIssue>(): FormiFieldBuilder<Value, Issue | NextIssue, Children> {
      return self;
    }

    function validate<NextValue = Value, NextIssue = never>(
      validateFn: ValidateFn<Value, NextValue, Issue | NextIssue>
    ): FormiFieldBuilder<NextValue, Issue | NextIssue, Children> {
      const nextValidate = (input: any) => {
        const prev = currentValidateFn(input);
        if (!prev.success) {
          return prev;
        }
        return validateFn(prev.value);
      };
      return createFieldBuilder(children, nextValidate);
    }

    function zodValidate<NextValue = Value>(schema: z.Schema<NextValue>): FormiFieldBuilder<NextValue, Issue | FormiIssueZod, Children> {
      return validate(zodValidator(schema));
    }
  }

  // utils

  function isFormiField(field: any): field is FormiField<any, any, any> {
    return field && field[FIELD_INTERNAL];
  }

  function getBuilder(field: FormiFieldAny): FormiFieldBuilderAny {
    return field[FIELD_INTERNAL].builder;
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

  function isSingleValue(input: InputBase<null>): ValidateResult<FormDataEntryValue | null, FormiIssueSingle> {
    if (input.values === null) {
      return success(null);
    }
    if (input.values.length === 0) {
      return success(null);
    }
    if (input.values.length === 1) {
      return success(input.values[0]);
    }
    return failure({ kind: 'UnexpectedMultipleValues' });
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

  function isNumber(input: string | null): ValidateResult<number | null, FormiIssueNumber> {
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

  function isFile(entry: FormDataEntryValue | null): ValidateResult<File, FormiIssueNotString> {
    if (entry === null) {
      return { success: false, issue: { kind: 'MissingField' } };
    }
    if (typeof entry === 'string') {
      return { success: false, issue: { kind: 'UnexpectedString' } };
    }
    return { success: true, value: entry };
  }

  function isNonEmptyFile(input: File): ValidateResult<File, FormiIssueNonEmptyFile> {
    if (input.size === 0) {
      return failure<FormiIssueNonEmptyFile>({ kind: 'EmptyFile' });
    }
    return success(input);
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
