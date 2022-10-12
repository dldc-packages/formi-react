import * as f from './FormiField';
import * as d from './FormiDef';
import { FormiController } from './FormiController';
import { ImmutableFormiMap } from './FormiMap';
import { FormiKey } from './FormiKey';

export const FORMI_INTERNAL = Symbol('FORMI_INTERNAL');
export type FORMI_INTERNAL = typeof FORMI_INTERNAL;

export const FORMI_TYPES = Symbol('FORMI_TYPES');
export type FORMI_TYPES = typeof FORMI_TYPES;

export type OnSubmitActions = {
  preventDefault: () => void;
  stopPropagation: () => void;
  reset: () => void;
};

export type OnSubmit<Def extends d.FormiDefAny> = (
  values: d.FormiDefValueOf<Def>,
  actions: OnSubmitActions,
  controller: FormiController<Def>
) => void;

export type IssuesMap = Array<{ sources: f.FormiFieldAny; issues: Array<any> }>;

export type FieldState_ValueAny = FieldState_Value<any, any>;

export type FieldState_Value<Value, Issue> = Readonly<{
  kind: 'Value';
  key: FormiKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    initialFormValue: FormDataEntryValue | undefined;
    formValue: FormDataEntryValue | undefined;
    value: Value | undefined;
    isTouched: boolean;
    isDirty: boolean;
    isSubmitted: boolean;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_MultipleAny = FieldState_Multiple<any, any>;

export type FieldState_Multiple<Value, Issue> = Readonly<{
  kind: 'Multiple';
  key: FormiKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    initialFormValue: Array<FormDataEntryValue> | undefined;
    formValue: Array<FormDataEntryValue> | undefined;
    value: Value | undefined;
    isTouched: boolean;
    isDirty: boolean;
    isSubmitted: boolean;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_ValidateAny = FieldState_Validate<any, any, any>;

export type FieldState_Validate<Child extends d.FormiDefAny, Value, Issue> = Readonly<{
  kind: 'Validate';
  key: FormiKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    formValue: d.FormiDefValueOf<Child> | undefined;
    value: Value | undefined;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_ArrayAny = FieldState_Array<Array<d.FormiDefAny>, any>;

export type FieldState_Array<Children extends Array<d.FormiDefAny>, Issue> = Readonly<{
  kind: 'Array';
  key: FormiKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    value: d.FormiDefValueOf_Array<Children> | undefined;
    length: number;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldState_ObjectAny = FieldState_Object<Record<string, d.FormiDefAny>, any>;

export type FieldState_Object<Children extends Record<string, d.FormiDefAny>, Issue> = Readonly<{
  kind: 'Object';
  key: FormiKey;
  issuesMap: IssuesMap;
  public: Readonly<{
    value: d.FormiDefValueOf_Object<Children> | undefined;
    issues: null | Array<Issue>;
  }>;
}>;

export type FieldStateAny =
  | FieldState_ValueAny
  | FieldState_MultipleAny
  | FieldState_ValidateAny
  | FieldState_ObjectAny
  | FieldState_ArrayAny;

export type FieldsStateMap = ImmutableFormiMap<FormiKey, FieldStateAny>;

export type FormiControllerState = {
  fields: f.FormiFieldAny; // Tree of fields
  states: FieldsStateMap; // FieldKey => state
};

export type FieldStateOf<FormiField extends f.FormiFieldAny> = FormiField extends f.FormiField_Value<infer V, infer I>
  ? FieldState_Value<V, I>
  : FormiField extends f.FormiField_Multiple<infer V, infer I>
  ? FieldState_Multiple<V, I>
  : FormiField extends f.FormiField_Validate<infer C, infer V, infer I>
  ? FieldState_Validate<C, V, I>
  : FormiField extends f.FormiField_Array<infer C, infer I>
  ? FieldState_Array<C, I>
  : FormiField extends f.FormiField_Object<infer C, infer I>
  ? FieldState_Object<C, I>
  : never;

export type PublicFieldStateOf<FormiField extends f.FormiFieldAny> = FieldStateOf<FormiField>['public'];
