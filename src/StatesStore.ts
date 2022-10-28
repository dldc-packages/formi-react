import { SubscribeMethod, Subscription } from 'suub';
import { FormiIssueBase, getFormiDefValidateFn } from './FormiDef';
import { FormiField, FormiFieldAny } from './FormiField';
import { FormiKey } from './FormiKey';
import { ImmutableImmuMap, ImmutableImmuMapDraft } from './tools/ImmuMap';
import { Path } from './tools/Path';
import { FieldStateAny, FormiIssues } from './types';
import { expectNever, shallowEqual } from './utils';

export type FieldsStateMap = ImmutableImmuMap<FormiKey, FieldStateAny>;
export type FieldsStateMapDraft = ImmutableImmuMapDraft<FormiKey, FieldStateAny>;

type FormiStatesActions =
  | { type: 'Init'; fields: FormiFieldAny }
  | { type: 'Mount'; data: FormData; fields: FormiFieldAny }
  | { type: 'Submit'; data: FormData; fields: FormiFieldAny }
  | { type: 'Reset'; data: FormData; fields: FormiFieldAny }
  | { type: 'Change'; data: FormData; fieldList: ReadonlyArray<FormiFieldAny> }
  | { type: 'SetIssues'; issues: FormiIssues<any>; fields: FormiFieldAny };

export interface StatesStore {
  readonly subscribe: SubscribeMethod<FieldsStateMap>;
  readonly getState: () => FieldsStateMap;
  readonly dispatch: (action: FormiStatesActions) => FieldsStateMap;
}

export const StatesStore = (() => {
  return create;

  function create(fields: FormiFieldAny, issues: FormiIssues<any> | undefined): StatesStore {
    let state: FieldsStateMap = createInitialState(fields, issues);
    const subscription = Subscription<FieldsStateMap>();

    return {
      subscribe: subscription.subscribe,
      getState,
      dispatch,
    };

    function dispatch(action: FormiStatesActions): FieldsStateMap {
      let nextState: FieldsStateMap;
      try {
        nextState = reducer(state, action);
      } catch (error) {
        console.error(error);
        return state;
      }
      if (nextState !== state) {
        state = nextState;
        subscription.emit(state);
      }
      return state;
    }

    function getState(): FieldsStateMap {
      return state;
    }

    function reducer(state: FieldsStateMap, action: FormiStatesActions): FieldsStateMap {
      if (action.type === 'Init') {
        return state.produce((draft) => {
          FormiField.traverse(action.fields, (field, next) => {
            const state = draft.get(field.key);
            if (state) {
              next();
              return;
            }
            initializeFieldStateMap(field, draft, undefined);
          });
        });
      }
      if (action.type === 'Mount') {
        return state.produce((draft) => {
          FormiField.traverse(action.fields, (field, next) => {
            // mount children first
            next();
            draft.updateOrThrow(field.key, (prev) => {
              if (prev.isMounted) {
                return prev;
              }
              const input = getInput(draft, field, action.data);
              const result = runValidate(field, input);
              const isTouched = false;
              return {
                ...prev,
                isMounted: true,
                initialRawValue: input,
                rawValue: input,
                ...validateResultToPartialState(result, isTouched),
              };
            });
          });
        });
      }
      if (action.type === 'Change') {
        return state.produce((draft) => {
          for (const field of action.fieldList) {
            const input = getInput(draft, field, action.data);
            const prev = draft.getOrThrow(field.key);
            if (prev.isMounted && shallowEqual(prev.rawValue, input)) {
              // input is the same, stop validation
              break;
            }
            const result = runValidate(field, input);
            const isTouched = true;
            const next: FieldStateAny = {
              ...prev,
              isDirty: shallowEqual(prev.initialRawValue, input) === false,
              isMounted: true,
              rawValue: input,
              isTouched,
              hasExternalIssues: false,
              ...validateResultToPartialState(result, isTouched),
            };
            draft.set(field.key, next);
          }
        });
      }
      if (action.type === 'Submit') {
        return state.produce((draft) => {
          FormiField.traverse(action.fields, (field, next) => {
            next();
            draft.updateOrThrow(field.key, (prev) => {
              if (prev.hasExternalIssues) {
                return prev;
              }
              const input = getInput(draft, field, action.data);
              const result = runValidate(field, input);
              const isTouched = true;
              return {
                ...prev,
                isMounted: true,
                initialRawValue: input,
                rawValue: input,
                isSubmitted: true,
                ...validateResultToPartialState(result, isTouched),
              };
            });
          });
        });
      }
      if (action.type === 'Reset') {
        return state.produce((draft) => {
          FormiField.traverse(action.fields, (field, next) => {
            next();
            draft.updateOrThrow(field.key, (prev) => {
              const input = getInput(draft, field, action.data);
              const result = runValidate(field, input);
              const isTouched = false;
              return {
                ...prev,
                initialRawValue: input,
                rawValue: input,
                isDirty: false,
                isTouched,
                isSubmitted: false,
                isMounted: true,
                hasExternalIssues: false,
                ...validateResultToPartialState(result, isTouched),
              };
            });
          });
        });
      }
      if (action.type === 'SetIssues') {
        return state.produce((draft) => {
          FormiField.traverse(action.fields, (field, next) => {
            next();
            draft.updateOrThrow(field.key, (prev) => {
              const issues = getFieldIssues(field, action.issues);
              if (!issues) {
                return prev;
              }
              const mergedIssues = prev.issues ? [...prev.issues, ...issues] : issues;
              return {
                ...prev,
                value: undefined,
                isSubmitted: true,
                isTouched: true,
                issues: mergedIssues,
                hasExternalIssues: true,
                touchedIssues: mergedIssues,
              };
            });
          });
        });
      }
      return expectNever(action, (action) => {
        throw new Error(`Unhandled action ${JSON.stringify(action ?? null)}`);
      });
    }

    function createInitialState(fields: FormiFieldAny, issues: FormiIssues<any> | undefined): FieldsStateMap {
      const map = ImmutableImmuMap.empty<FormiKey, FieldStateAny>();
      const draft = map.draft();
      initializeFieldStateMap(fields, draft, issues);
      return draft.commit();
    }

    function getFieldIssues(field: FormiFieldAny, issues: FormiIssues<any> | undefined) {
      const initialIssues = issues
        ?.filter((item) => Path.equal(item.path, field.path))
        .map((item) => item.issues)
        .flat();
      const issuesResolved = initialIssues && initialIssues.length > 0 ? initialIssues : null;
      return issuesResolved;
    }

    function createFieldState(field: FormiFieldAny, issues: FormiIssues<any> | undefined): FieldStateAny {
      const issuesResolved = getFieldIssues(field, issues);
      return {
        key: field.key,
        initialRawValue: undefined,
        rawValue: undefined,
        value: undefined,
        issues: issuesResolved,
        touchedIssues: issuesResolved,
        hasExternalIssues: issuesResolved !== null,
        isTouched: false,
        isDirty: false,
        isSubmitted: false,
        isMounted: false,
      };
    }

    function initializeFieldStateMap(field: FormiFieldAny, draft: FieldsStateMapDraft, issues: FormiIssues<any> | undefined): void {
      if (field.kind === 'Value') {
        draft.set(field.key, createFieldState(field, issues));
        return;
      }
      if (field.kind === 'Values') {
        draft.set(field.key, createFieldState(field, issues));
        return;
      }
      if (field.kind === 'Repeat') {
        draft.set(field.key, createFieldState(field, issues));
        field.children.forEach((child) => {
          initializeFieldStateMap(child, draft, issues);
        });
        return;
      }
      if (field.kind === 'Object') {
        draft.set(field.key, createFieldState(field, issues));
        Object.values(field.children).forEach((child) => {
          initializeFieldStateMap(child, draft, issues);
        });
        return;
      }
    }

    type ValidateResult = { status: 'success'; value: unknown } | { status: 'error'; issues: any[] } | { status: 'unkown' };

    type GetValueResult = { resolved: false } | { resolved: true; value: any };

    function runValidate(field: FormiFieldAny, value: any): ValidateResult {
      const isCombined = field.kind === 'Object' || field.kind === 'Repeat';
      if (value === null && isCombined) {
        // Don't run validate if children are not resolved
        return { status: 'unkown' };
      }
      const validateFn = getFormiDefValidateFn(field.def);
      try {
        const result = validateFn(value);
        if (result.success) {
          if (result.value === undefined) {
            throw new Error(`Expected a value to be returned from the validation function (got undefined).`);
          }
          return { status: 'success', value: result.value };
        }
        let issues = result.issues ? result.issues : result.issue ? [result.issue] : null;
        if (issues && issues.length === 0) {
          issues = null;
        }
        if (issues === null) {
          return { status: 'unkown' };
        }
        return { status: 'error', issues };
      } catch (error) {
        const issue: FormiIssueBase = { kind: 'ValidationError', error };
        return { status: 'error', issues: [issue] };
      }
    }

    function getInput(draft: FieldsStateMapDraft, field: FormiFieldAny, data: FormData): null | any {
      if (field.kind === 'Value') {
        const value = data.get(field.name);
        return value;
      }
      if (field.kind === 'Values') {
        if (data.has(field.name) === false) {
          return null;
        }
        return data.getAll(field.name);
      }
      if (field.kind === 'Repeat') {
        const input: Array<unknown> = [];
        for (const child of field.children) {
          const childValue = getValue(draft, child);
          if (childValue.resolved === false) {
            return null;
          }
          input.push(childValue.value);
        }
        return input;
      }
      if (field.kind === 'Object') {
        const input: Record<string, unknown> = {};
        for (const [key, child] of Object.entries(field.children)) {
          const childValue = getValue(draft, child);
          if (childValue.resolved === false) {
            return null;
          }
          input[key] = childValue.value;
        }
        return input;
      }
      return expectNever(field, (field) => {
        throw new Error(`Unhandled field ${JSON.stringify(field ?? null)}`);
      });
    }

    function getValue(draft: FieldsStateMapDraft, field: FormiFieldAny): GetValueResult {
      const state = draft.getOrThrow(field.key);
      if (state.isMounted === false) {
        return { resolved: false };
      }
      if (state.issues !== null) {
        return { resolved: false };
      }
      if (state.value === undefined) {
        return { resolved: false };
      }
      return { resolved: true, value: state.value };
    }

    type PartialFieldState = {
      value: any;
      issues: any[] | null;
      touchedIssues: any[] | null;
    };

    function validateResultToPartialState(result: ValidateResult, isTouched: boolean): PartialFieldState {
      if (result.status === 'success') {
        return { value: result.value, issues: null, touchedIssues: null };
      }
      if (result.status === 'error') {
        return { value: undefined, issues: result.issues, touchedIssues: isTouched ? result.issues : null };
      }
      if (result.status === 'unkown') {
        return { value: undefined, issues: null, touchedIssues: null };
      }
      return expectNever(result);
    }
  }
})();
