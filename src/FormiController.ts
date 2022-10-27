import { SubscribeMethod } from 'suub';
import { FieldsStateMap, FormiStatesStore } from './FormiStatesStore';
import { Path } from './tools/Path';
import { FormiKey } from './FormiKey';
import { FormiIssuesBuilder } from './FormiIssuesBuilder';
import { FormiFieldsStore } from './FormiFieldsStore';
import { FormiFieldAny, FormiField } from './FormiField';
import { FormiDefAny, FormiIssue } from './FormiDef';
import { FormiResult, FormiIssues, OnSubmit, OnSubmitActions, FieldStateAny } from './types';

const IS_FORM_CONTROLLER = Symbol('IS_FORM_CONTROLLER');

export interface FormiController<T extends FormiDefAny> {
  readonly [IS_FORM_CONTROLLER]: true;
  readonly formName: string;
  readonly getFields: () => FormiFieldAny;
  readonly subscribeFields: SubscribeMethod<FormiFieldAny>;
  readonly getStates: () => FieldsStateMap;
  readonly subscribeStates: SubscribeMethod<FieldsStateMap>;

  readonly submit: (data: FormData) => void;
  readonly getResult: () => FormiResult<T>;
  readonly setIssues: (issues: FormiIssues<any>) => void;

  readonly findFieldByKeyOrThrow: (key: FormiKey) => FormiFieldAny;
  readonly setOnSubmit: (onSubmit: OnSubmit<T>) => void;
  readonly debugStates: () => Array<{ field: FormiFieldAny; state: FieldStateAny }>;

  readonly mount: (formEl: HTMLFormElement) => void;
  readonly unmount: () => void;
}

export type FormiControllerOptions<Def extends FormiDefAny> = {
  fields: Def;
  formName: string;
  onSubmit?: OnSubmit<Def>;
  validateOnMount?: boolean;
  initialIssues?: FormiIssues<any>;
};

export type FormiControllerAny = FormiController<FormiDefAny>;

export const FormiController = (() => {
  return Object.assign(create, { validate });

  function validate<T extends FormiDefAny>(options: FormiControllerOptions<T>, data: FormData): FormiResult<T> {
    const controller = create<T>(options);
    controller.submit(data);
    return controller.getResult();
  }

  function create<T extends FormiDefAny>({
    formName,
    validateOnMount = true,
    fields: fieldsDef,
    onSubmit: userOnSubmit,
    initialIssues,
  }: FormiControllerOptions<T>): FormiController<T> {
    Path.validatePathItem(formName);

    let onSubmit: OnSubmit<T> | null = userOnSubmit ?? null;
    let formEl: HTMLFormElement | null = null;

    const fieldsStore = FormiFieldsStore(formName, fieldsDef);
    const statesStore = FormiStatesStore(fieldsStore.getState(), initialIssues);

    const self: FormiController<T> = {
      [IS_FORM_CONTROLLER]: true,
      formName,

      getFields: fieldsStore.getState,
      subscribeFields: fieldsStore.subscribe,
      getStates: statesStore.getState,
      subscribeStates: statesStore.subscribe,

      submit,
      getResult,
      setIssues,

      setOnSubmit,
      findFieldByKeyOrThrow,
      debugStates,

      mount,
      unmount,
    };

    return self;

    function findFieldByKeyOrThrow(key: FormiKey): FormiFieldAny {
      return FormiField.findFieldByKeyOrThrow(fieldsStore.getState(), key);
    }

    function setOnSubmit(newOnSubmit: OnSubmit<T>) {
      onSubmit = newOnSubmit;
    }

    function setIssues(issues: FormiIssues<any>) {
      statesStore.dispatch({ type: 'SetIssues', issues, fields: fieldsStore.getState() });
    }

    function getResult(): FormiResult<T> {
      if (hasErrors() === false) {
        const value = getValueOrThrow();
        return { success: true, value, fields: fieldsStore.getState() as any, customIssues: FormiIssuesBuilder(fieldsDef) };
      }
      const issues = getIssuesOrThrow();
      return { success: false, issues };
    }

    function getForm() {
      if (!formEl) {
        throw new Error('[react-formi]: Form ref not passed');
      }
      return formEl;
    }

    function submit(data: FormData, actions?: OnSubmitActions) {
      statesStore.dispatch({ type: 'Submit', data, fields: fieldsStore.getState() });
      if (hasErrors()) {
        actions?.preventDefault();
        return;
      }
      const value = getValueOrThrow();
      if (onSubmit && actions) {
        onSubmit({ value, formData: data }, actions);
      }
    }

    function handleSubmit(event: SubmitEvent) {
      const form = getForm();
      const formData = new FormData(form);
      submit(formData, {
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        reset: () => form.reset(),
      });
    }

    function handleChange(event: Event) {
      const target = event.target;
      if (!target) {
        console.warn('No target ?');
        return;
      }
      const form = getForm();
      const input = target as HTMLInputElement;
      const name = input.name;
      const data = new FormData(form);
      const fieldPath = Path.from(name);
      const fieldList = FormiField.findAllFieldsByPath(fieldsStore.getState(), fieldPath);
      if (!fieldList) {
        console.warn(`Field not found: ${name}`);
        return;
      }
      statesStore.dispatch({ type: 'Change', data, fieldList });
    }

    function handleReset() {
      const form = getForm();
      const data = new FormData(form);
      statesStore.dispatch({ type: 'Reset', data, fields: fieldsStore.getState() });
    }

    function mount(newFormEl: HTMLFormElement) {
      if (formEl && formEl !== newFormEl) {
        unmount();
      }
      formEl = newFormEl;
      formEl.addEventListener('submit', handleSubmit);
      formEl.addEventListener('change', handleChange);
      formEl.addEventListener('reset', handleReset);
      const data = new FormData(formEl);
      if (validateOnMount) {
        statesStore.dispatch({ type: 'Mount', data, fields: fieldsStore.getState() });
      }
    }

    function unmount() {
      if (formEl) {
        formEl.removeEventListener('submit', handleSubmit);
        formEl.removeEventListener('change', handleChange);
      }
    }

    function debugStates(): Array<{ field: FormiFieldAny; state: FieldStateAny }> {
      const result: Array<{ field: FormiFieldAny; state: FieldStateAny }> = [];
      const fields = fieldsStore.getState();
      const states = statesStore.getState();
      FormiField.traverse(fields, (field, next) => {
        const state = states.get(field.key) as FieldStateAny;
        result.push({ field, state });
        next();
      });
      return result;
    }

    function hasErrors(): boolean {
      let errorFound = false;
      const states = statesStore.getState();
      FormiField.traverse(fieldsStore.getState(), (field, next) => {
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
      const states = statesStore.getState();
      const rootState = states.getOrThrow(fieldsStore.getState().key);
      if (rootState.isMounted === false) {
        throw new Error(`Cannot get values from unmounted form`);
      }
      if (rootState.value === undefined) {
        throw new Error('No value');
      }
      return rootState.value;
    }

    function getIssuesOrThrow(): FormiIssues<any> {
      const states = statesStore.getState();
      const issues: FormiIssues<any> = [];
      FormiField.traverse(fieldsStore.getState(), (field, next) => {
        next();
        const fieldState = states.getOrThrow(field.key);
        if (fieldState.isMounted === false) {
          const issue: FormiIssue = { kind: 'FieldNotMounted' };
          issues.push({ path: field.path.raw, issues: [issue] });
          return;
        }
        if (fieldState.issues) {
          issues.push({ path: field.path.raw, issues: fieldState.issues });
        }
      });
      return issues;
    }
  }
})();
