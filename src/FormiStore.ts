import { SubscribeMethod, Subscription } from 'suub';
import { FieldsUpdateFn } from './FormiController';
import { FormiField, FormiFieldAny, FormiFieldInput, FormiFieldIssue, FormiFieldValue } from './FormiField';
import { FormiFieldTree } from './FormiFieldTree';
import { FormiIssue, FormiIssueBase, FormiIssues } from './FormiIssue';
import { FormiKey } from './FormiKey';
import { ImmuWeakMap, ImmuWeakMapDraft } from './tools/ImmuWeakMap';
import { Path } from './tools/Path';
import { expectNever } from './utils';

export interface FieldState<Value, Issue, Input> {
  key: FormiKey;
  path: Path;
  name: string; // path as string
  keys: ReadonlyArray<FormiKey>;

  initialRawValue: Input | undefined;
  rawValue: Input | undefined;
  value: Value | undefined;
  issues: null | Array<Issue>;
  touchedIssues: null | Array<Issue>;
  hasExternalIssues: boolean; // Issues from initial issues or SetIssues
  isMounted: boolean; // Did the field received a value
  isTouched: boolean;
  isDirty: boolean;
  isSubmitted: boolean;
}

export type FieldStateOf<Field extends FormiFieldAny> = FieldState<FormiFieldValue<Field>, FormiFieldIssue<Field>, FormiFieldInput<Field>>;

export type FieldStateAny = FieldState<any, any, any>;

export type FieldsStateMap = ImmuWeakMap<FormiKey, FieldStateAny>;
export type FieldsStateMapDraft = ImmuWeakMapDraft<FormiKey, FieldStateAny>;

type FormiStoreActions =
  | { type: 'Init' }
  | { type: 'Mount'; data: FormData }
  | { type: 'Submit'; data: FormData }
  | { type: 'Reset'; data: FormData }
  | { type: 'Change'; data: FormData; fieldList: ReadonlyArray<FormiFieldAny> }
  | { type: 'SetIssues'; issues: FormiIssues<any> }
  | { type: 'SetFields'; fields: FormiFieldTree | FieldsUpdateFn<FormiFieldTree> };

export type RootFormiField = FormiField<any, any, FormiFieldTree>;

export type FormiState = {
  rootFieldWrapped: boolean;
  rootField: RootFormiField;
  states: FieldsStateMap;
};

export type DebugStateResult = Array<{ field: FormiFieldAny; state: FieldStateAny }>;

export interface FormiStore {
  readonly subscribe: SubscribeMethod<FormiState>;
  readonly getState: () => FormiState;
  readonly dispatch: (action: FormiStoreActions) => FormiState;
  // utils
  readonly hasErrors: () => boolean;
  readonly getValueOrThrow: () => any;
  readonly getIssuesOrThrow: () => FormiIssues<any>;

  readonly debugStates: () => DebugStateResult;
}

export const FormiStore = (() => {
  return create;

  function create(initialFields: FormiFieldTree, issues: FormiIssues<any> | undefined): FormiStore {
    let state: FormiState = createInitialState(initialFields, issues);
    const subscription = Subscription<FormiState>();

    return {
      subscribe: subscription.subscribe,
      getState,
      dispatch,
      getIssuesOrThrow,
      getValueOrThrow,
      hasErrors,
      debugStates,
    };

    function dispatch(action: FormiStoreActions): FormiState {
      let nextState: FormiState;
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

    function getState(): FormiState {
      return state;
    }

    function reducer(state: FormiState, action: FormiStoreActions): FormiState {
      if (action.type === 'Mount') {
        return updateStates(state, (draft, fields) => {
          FormiFieldTree.traverse(fields, (field, _path, next) => {
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

      console.log(action);
      throw new Error('Not implemented');
      //   if (action.type === 'Init') {
      //     return state.produce((draft) => {
      //       FormiFieldTree.traverse(action.fields, (field, next) => {
      //         const state = draft.get(field.key);
      //         if (state) {
      //           next();
      //           return;
      //         }
      //         initializeFieldStateMap(field, draft, undefined);
      //       });
      //       return draft.commit(FormiField.getKeys(action.fields));
      //     });
      //   }
      //   if (action.type === 'Mount') {
      //     return state.produce((draft) => {
      //       FormiFieldTree.traverse(action.fields, (field, next) => {
      //         // mount children first
      //         next();
      //         draft.updateOrThrow(field.key, (prev) => {
      //           if (prev.isMounted) {
      //             return prev;
      //           }
      //           const input = getInput(draft, field, action.data);
      //           const result = runValidate(field, input);
      //           const isTouched = false;
      //           return {
      //             ...prev,
      //             isMounted: true,
      //             initialRawValue: input,
      //             rawValue: input,
      //             ...validateResultToPartialState(result, isTouched),
      //           };
      //         });
      //       });
      //       return draft.commit(FormiField.getKeys(action.fields));
      //     });
      //   }
      //   if (action.type === 'Change') {
      //     return state.produce((draft) => {
      //       for (const field of action.fieldList) {
      //         const input = getInput(draft, field, action.data);
      //         const prev = draft.getOrThrow(field.key);
      //         if (prev.isMounted && shallowEqual(prev.rawValue, input)) {
      //           // input is the same, stop validation
      //           break;
      //         }
      //         const result = runValidate(field, input);
      //         const isTouched = true;
      //         const next: FieldState = {
      //           ...prev,
      //           isDirty: shallowEqual(prev.initialRawValue, input) === false,
      //           isMounted: true,
      //           rawValue: input,
      //           isTouched,
      //           hasExternalIssues: false,
      //           ...validateResultToPartialState(result, isTouched),
      //         };
      //         draft.set(field.key, next);
      //       }
      //       return draft.commit(FormiField.getKeys(action.fields));
      //     });
      //   }
      //   if (action.type === 'Submit') {
      //     return state.produce((draft) => {
      //       FormiFieldTree.traverse(action.fields, (field, next) => {
      //         next();
      //         draft.updateOrThrow(field.key, (prev) => {
      //           if (prev.hasExternalIssues) {
      //             return prev;
      //           }
      //           const input = getInput(draft, field, action.data);
      //           const result = runValidate(field, input);
      //           const isTouched = true;
      //           return {
      //             ...prev,
      //             isMounted: true,
      //             initialRawValue: input,
      //             rawValue: input,
      //             isSubmitted: true,
      //             ...validateResultToPartialState(result, isTouched),
      //           };
      //         });
      //       });
      //       return draft.commit(FormiField.getKeys(action.fields));
      //     });
      //   }
      //   if (action.type === 'Reset') {
      //     return state.produce((draft) => {
      //       FormiFieldTree.traverse(action.fields, (field, next) => {
      //         next();
      //         draft.updateOrThrow(field.key, (prev) => {
      //           const input = getInput(draft, field, action.data);
      //           const result = runValidate(field, input);
      //           const isTouched = false;
      //           return {
      //             ...prev,
      //             initialRawValue: input,
      //             rawValue: input,
      //             isDirty: false,
      //             isTouched,
      //             isSubmitted: false,
      //             isMounted: true,
      //             hasExternalIssues: false,
      //             ...validateResultToPartialState(result, isTouched),
      //           };
      //         });
      //       });
      //       return draft.commit(FormiField.getKeys(action.fields));
      //     });
      //   }
      //   if (action.type === 'SetIssues') {
      //     return state.produce((draft) => {
      //       FormiFieldTree.traverse(action.fields, (field, next) => {
      //         next();
      //         draft.updateOrThrow(field.key, (prev) => {
      //           const issues = getFieldIssues(field, action.issues);
      //           if (!issues) {
      //             return prev;
      //           }
      //           const mergedIssues = prev.issues ? [...prev.issues, ...issues] : issues;
      //           return {
      //             ...prev,
      //             value: undefined,
      //             isSubmitted: true,
      //             isTouched: true,
      //             issues: mergedIssues,
      //             hasExternalIssues: true,
      //             touchedIssues: mergedIssues,
      //           };
      //         });
      //       });
      //       return draft.commit(FormiField.getKeys(action.fields));
      //     });
      //   }
      //   return expectNever(action, (action) => {
      //     throw new Error(`Unhandled action ${JSON.stringify(action ?? null)}`);
      //   });
    }

    function updateStates(state: FormiState, updater: (draft: FieldsStateMapDraft, fields: RootFormiField) => void): FormiState {
      const draft = state.states.draft();
      updater(draft, state.rootField);
      const nextStates = commiStatesDraft(draft, state.rootField);
      if (nextStates === state.states) {
        return state;
      }
      return { ...state, states: nextStates };
    }

    function createInitialState(fields: FormiFieldTree, issues: FormiIssues<any> | undefined): FormiState {
      const map = ImmuWeakMap.empty<FormiKey, FieldStateAny>();
      const draft = map.draft();
      const rootField = FormiFieldTree.wrap(fields);
      initializeFieldStateMap(rootField, draft, issues);
      return {
        rootFieldWrapped: rootField !== fields,
        rootField,
        states: commiStatesDraft(draft, rootField),
      };
    }

    function commiStatesDraft(draft: FieldsStateMapDraft, rootField: RootFormiField): FieldsStateMap {
      const rootState = draft.getOrThrow(rootField.key);
      return draft.commit(rootState.keys);
    }

    function getFieldIssues(path: Path, issues: FormiIssues<any> | undefined) {
      const initialIssues = issues
        ?.filter((item) => Path.equal(item.path, path))
        .map((item) => item.issues)
        .flat();
      const issuesResolved = initialIssues && initialIssues.length > 0 ? initialIssues : null;
      return issuesResolved;
    }

    function createFieldState(field: FormiFieldAny, path: Path, issues: FormiIssues<any> | undefined): FieldStateAny {
      const issuesResolved = getFieldIssues(path, issues);
      return {
        key: field.key,
        path,
        name: path.serialize(),
        keys: [],
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

    function initializeFieldStateMap(tree: FormiFieldTree, draft: FieldsStateMapDraft, issues: FormiIssues<any> | undefined): void {
      FormiFieldTree.traverse(tree, (field, path, next) => {
        draft.set(field.key, createFieldState(field, path, issues));
        next();
      });
    }

    type ValidateResult = { status: 'success'; value: unknown } | { status: 'error'; issues: any[] } | { status: 'unkown' };

    type GetValueResult = { resolved: false } | { resolved: true; value: any };

    function runValidate(field: FormiFieldAny, value: any): ValidateResult {
      const isGroup = field.kind === 'Group';
      if (isGroup && value === null) {
        // Don't run validate if children are not resolved
        return { status: 'unkown' };
      }
      const validateFn = FormiField.utils.getValidate(field);
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
      const { states } = getState();
      const state = states.getOrThrow(field.key);
      if (field.kind === 'Value') {
        const value = data.get(state.name);
        return value;
      }
      if (field.kind === 'Values') {
        if (data.has(state.name) === false) {
          return null;
        }
        return data.getAll(state.name);
      }
      if (field.kind === 'Group') {
        throw new Error(`Not implemented: get input for group`);
      }
      return expectNever(field.kind, (fieldKind) => {
        throw new Error(`Unhandled field kind ${fieldKind}`);
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

    function debugStates(): DebugStateResult {
      const result: Array<{ field: FormiFieldAny; state: FieldStateAny }> = [];
      const { rootField, states } = getState();
      FormiFieldTree.traverse(rootField, (field, path, next) => {
        const state = states.get(field.key) as FieldStateAny;
        result.push({ field, state });
        next();
      });
      return result;
    }

    function hasErrors(): boolean {
      let errorFound = false;
      const { states, rootField } = getState();
      FormiFieldTree.traverse(rootField, (field, path, next) => {
        if (errorFound) {
          return;
        }
        const fieldState = states.getOrThrow(field.key);
        if (fieldState.isMounted === false) {
          errorFound = true;
          return;
        }
        if (fieldState.issues) {
          errorFound = true;
          return;
        }
        next();
      });
      return errorFound;
    }

    function getValueOrThrow(): any {
      const { states, rootField } = getState();
      const rootState = states.getOrThrow(rootField.key);
      if (rootState.isMounted === false) {
        throw new Error(`Cannot get values from unmounted form`);
      }
      if (rootState.value === undefined) {
        throw new Error('No value');
      }
      return rootState.value;
    }

    function getIssuesOrThrow(): FormiIssues<any> {
      const { states, rootField } = getState();
      const issues: FormiIssues<any> = [];
      FormiFieldTree.traverse(rootField, (field, path, next) => {
        next();
        const fieldState = states.getOrThrow(field.key);
        if (fieldState.isMounted === false) {
          const issue: FormiIssue = { kind: 'FieldNotMounted' };
          issues.push({ path: path.raw, issues: [issue] });
          return;
        }
        if (fieldState.issues) {
          issues.push({ path: path.raw, issues: fieldState.issues });
        }
      });
      return issues;
    }
  }
})();
