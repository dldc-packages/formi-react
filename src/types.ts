import * as z from 'zod';
import { FormFieldIssues } from './FormFieldIssues';
import { FormController } from './FormController';
import * as f from './FormField';
import { ReadonlyMap } from './ReadonlyMap';

export const FORM_INTERNAL = Symbol('FORM_INTERNAL');
export type FORM_INTERNAL = typeof FORM_INTERNAL;

export const NOT_SET = Symbol('NOT_SET');
export type NOT_SET = typeof NOT_SET;

export type FormValue = FormDataEntryValue | Array<FormDataEntryValue>;

export type FieldSchema<Value, FormValue> = z.Schema<Value, z.ZodTypeDef, FormValue>;

export type FieldValidateFnContext<F extends f.FormFieldOfAny, Issue> = {
  issues: FormFieldIssues<Issue>;
  field: F;
};

export type FieldValidateFnResult<Value, Issue> = Value | FormFieldIssues<Issue>;

export type FieldValidateFn<FormField extends f.FormFieldOfAny, Input, Value, Issue> = (
  value: Input,
  context: FieldValidateFnContext<FormField, Issue>
) => Value;

export type FieldValidateFn_Value<Value, Issue> = FieldValidateFn<f.FormField_Value<Value, Issue>, FormDataEntryValue, Value, Issue>;

export type FieldValidateFn_Multiple<Value, Issue> = FieldValidateFn<
  f.FormField_Multiple<Value, Issue>,
  Array<FormDataEntryValue>,
  Value,
  Issue
>;

export type FieldValidateFn_Validate<Child extends FieldAny, Value, Issue> = FieldValidateFn<
  f.FormField_Validate<Child, Value, Issue>,
  FieldValueOf<Child>,
  Value,
  Issue
>;

export interface FieldBase<Value, Issue> {
  readonly [FORM_INTERNAL]: { __value: Value; __issue: Issue };
}
export type FieldBaseAny = FieldBase<any, any>;

export interface Field_Value<Value, Issue> extends FieldBase<Value, Issue> {
  readonly kind: 'Value';
  readonly validate: FieldValidateFn<f.FormField_Value<Value, Issue>, FormDataEntryValue, Value, Issue>;
}
export type Field_ValueAny = Field_Value<any, any>;

export interface Field_Multiple<Value, Issue> extends FieldBase<Value, Issue> {
  readonly kind: 'Multiple';
  readonly validate: FieldValidateFn<f.FormField_Multiple<Value, Issue>, Array<FormDataEntryValue>, Value, Issue>;
}
export type Field_MultipleAny = Field_Multiple<any, any>;

export interface Field_Validate<Child extends FieldAny, Value, Issue> extends FieldBase<Value, Issue> {
  readonly kind: 'Validate';
  readonly child: Child;
  readonly validate: FieldValidateFn<f.FormField_Validate<Child, Value, Issue>, FieldValueOf<Child>, Value, Issue>;
}
export type Field_ValidateAny = Field_Validate<any, any, any>;

export interface Field_Object<Children extends Record<string, FieldAny>, Issue> extends FieldBase<FieldValueOf_Object<Children>, Issue> {
  readonly kind: 'Object';
  readonly children: Children;
}
export type FieldValueOf_Object<Children extends Record<string, FieldAny>> = { [K in keyof Children]: FieldValueOf<Children[K]> };
export type Field_ObjectAny = Field_Object<Record<string, FieldAny>, any>;

export interface Field_Array<Children extends Array<FieldAny>, Issue> extends FieldBase<FieldValueOf_Array<Children>, Issue> {
  readonly kind: 'Array';
  readonly children: Children;
}
export type FieldValueOf_Array<Children extends Array<FieldAny>> = Children extends Array<infer Child>
  ? Child extends FieldAny
    ? Array<FieldValueOf<Child>>
    : never
  : never;
export type Field_ArrayAny = Field_Array<Array<FieldAny>, any>;

export type FieldAny = Field_ValueAny | Field_ValidateAny | Field_MultipleAny | Field_ArrayAny | Field_ObjectAny;

export type FieldValueOf<Field extends FieldBaseAny> = Field[FORM_INTERNAL]['__value'];
export type FieldIssueOf<Field extends FieldBaseAny> = Field[FORM_INTERNAL]['__issue'];

export type OnSubmitActions = {
  preventDefault: () => void;
  stopPropagation: () => void;
  reset: () => void;
};

export type OnSubmit<Field extends FieldAny> = (
  values: FieldValueOf<Field>,
  actions: OnSubmitActions,
  controller: FormController<Field>
) => void;

/**
 * Each field is given a unique key used to track it
 * (we don't user input name since it could change when you shift / unshift an array item for example)
 */
export type FieldKey = {
  readonly [FORM_INTERNAL]: true;
  // dynamically get the the field (used for debugging only)
  readonly field: f.FormFieldAny;
};

export type IssuesMap = Array<{ sources: f.FormFieldAny; issues: Array<any> }>;

export type FieldState_ValueAny = FieldState_Value<any, any>;

export type FieldState_Value<Value, Issue> = Readonly<{
  kind: 'Value';
  key: FieldKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    initialFormValue: FormDataEntryValue | NOT_SET;
    formValue: FormDataEntryValue | NOT_SET;
    value: Value | NOT_SET;
    isTouched: boolean;
    isDirty: boolean;
    isSubmitted: boolean;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_MultipleAny = FieldState_Multiple<any, any>;

export type FieldState_Multiple<Value, Issue> = Readonly<{
  kind: 'Multiple';
  key: FieldKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    initialFormValue: Array<FormDataEntryValue> | NOT_SET;
    formValue: Array<FormDataEntryValue> | NOT_SET;
    value: Value | NOT_SET;
    isTouched: boolean;
    isDirty: boolean;
    isSubmitted: boolean;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_ValidateAny = FieldState_Validate<any, any, any>;

export type FieldState_Validate<Child extends FieldAny, Value, Issue> = Readonly<{
  kind: 'Validate';
  key: FieldKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    formValue: FieldValueOf<Child> | NOT_SET;
    value: Value | NOT_SET;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_ArrayAny = FieldState_Array<Array<FieldAny>, any>;

export type FieldState_Array<Children extends Array<FieldAny>, Issue> = Readonly<{
  kind: 'Array';
  key: FieldKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    value: FieldValueOf_Array<Children> | NOT_SET;
    length: number;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_ObjectAny = FieldState_Object<Record<string, FieldAny>, any>;

export type FieldState_Object<Children extends Record<string, FieldAny>, Issue> = Readonly<{
  kind: 'Object';
  key: FieldKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    value: FieldValueOf_Object<Children> | NOT_SET;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldStateAny = FieldState_ValueAny | FieldState_ObjectAny | FieldState_ArrayAny | FieldState_MultipleAny;

export type FieldsStateMap = ReadonlyMap<FieldKey, FieldStateAny>;

export type FormControllerState = {
  fields: f.FormFieldOfAny; // Structure of fields
  states: FieldsStateMap; // FieldKey => state
};

export type FieldStateOf<FormField extends f.FormFieldOfAny> = FormField extends f.FormField_Value<infer V, infer I>
  ? FieldState_Value<V, I>
  : FormField extends f.FormField_Multiple<infer V, infer I>
  ? FieldState_Multiple<V, I>
  : FormField extends f.FormField_Validate<infer C, infer V, infer I>
  ? FieldState_Validate<C, V, I>
  : FormField extends f.FormField_Array<infer C, infer I>
  ? FieldState_Array<C, I>
  : FormField extends f.FormField_Object<infer C, infer I>
  ? FieldState_Object<C, I>
  : never;

export type PublicFieldStateOf<FormField extends f.FormFieldOfAny> = FieldStateOf<FormField>['public'];
