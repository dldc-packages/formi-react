import * as f from './FormiField';
import * as d from './FormiDef';
import { FormiKey } from './FormiKey';
import { z } from 'zod';
import { RawPath } from './tools/Path';
import { FormiIssuesBuilder } from './FormiIssuesBuilder';

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
  data: { value: d.FormiDefValueOf<Def>; formData: FormData },
  actions: OnSubmitActions
) => void;

export type FieldState<Value, Issue> = Readonly<{
  key: FormiKey;
  initialRawValue: any | undefined;
  rawValue: any | undefined;
  value: Value | undefined;
  issues: null | Array<Issue>;
  touchedIssues: null | Array<Issue>;
  hasExternalIssues: boolean; // Issues from initial issues or SetIssues
  isMounted: boolean; // Did the field received a value
  isTouched: boolean;
  isDirty: boolean;
  isSubmitted: boolean;
}>;

export type FieldStateAny = FieldState<any, any>;

export type FieldStateOf<FormiField extends f.FormiFieldAny> = FormiField extends f.FormiField_Value<infer V, infer I>
  ? FieldState<V, I>
  : FormiField extends f.FormiField_Values<infer V, infer I>
  ? FieldState<V, I>
  : FormiField extends f.FormiField_Repeat<any, infer V, infer I>
  ? FieldState<V, I>
  : FormiField extends f.FormiField_Object<any, infer V, infer I>
  ? FieldState<V, I>
  : never;

export type FieldIssueOf<FormiField extends f.FormiFieldAny> = FormiField extends f.FormiField_Value<any, infer I>
  ? I
  : FormiField extends f.FormiField_Values<any, infer I>
  ? I
  : FormiField extends f.FormiField_Repeat<any, any, infer I>
  ? I
  : FormiField extends f.FormiField_Object<any, any, infer I>
  ? I
  : never;

export type FieldAllIssueOf<Def extends d.FormiDefAny> = Def extends d.FormiDef_Value<any, infer I>
  ? I
  : Def extends d.FormiDef_Values<any, infer I>
  ? I
  : Def extends d.FormiDef_Repeat<infer Children, any, infer I>
  ? I | FieldAllIssueOf<Children>
  : Def extends d.FormiDef_Object<infer Children, any, infer I>
  ? I | { [K in keyof Children]: FieldAllIssueOf<Children[K]> }[keyof Children]
  : never;

export type FormiIssue =
  | { kind: 'InvalidNumber'; value: string }
  | { kind: 'UnexpectedFile' }
  | { kind: 'UnexpectedString' }
  | { kind: 'MissingField' }
  | { kind: 'ZodIssue'; issue: z.ZodIssue }
  | { kind: 'FieldNotMounted' }
  // generated when the validate fn throws an error
  | { kind: 'ValidationError'; error: unknown };

export type FormiIssuesItem<Issue> = { path: RawPath; issues: Array<Issue> };
export type FormiIssues<Issue> = Array<FormiIssuesItem<Issue>>;

export type FormiResult<Def extends d.FormiDefAny> =
  | {
      success: true;
      value: d.FormiDefValueOf<Def>;
      fields: f.FormiFieldOf<Def>;
      // empty issues to make it easy to add custom server validation
      customIssues: FormiIssuesBuilder<FieldAllIssueOf<Def>>;
    }
  | { success: false; issues: FormiIssues<FieldAllIssueOf<Def>> };
