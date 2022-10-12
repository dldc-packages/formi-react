import * as t from './types';
import { SubscribeMethod } from 'suub';
import { FormiStore } from './FormiStore';
import { Path } from './Path';
import { FormiKey } from './FormiKey';
import * as f from './FormiField';
import * as d from './FormiDef';

const IS_FORM_CONTROLLER = Symbol('IS_FORM_CONTROLLER');

export interface FormiController<T extends d.FormiDefAny> {
  readonly [IS_FORM_CONTROLLER]: true;
  readonly formName: string;
  readonly setOnSubmit: (onSubmit: t.OnSubmit<T>) => void;
  readonly register: (formEl: HTMLFormElement) => void;
  readonly validate: () => void;
  readonly findFieldByKeyOrThrow: (key: FormiKey) => f.FormiFieldAny;
  readonly subscribe: SubscribeMethod<t.FormiControllerState>;
  readonly getState: () => t.FormiControllerState;
}

export type FormiControllerOptions<T extends d.FormiDefAny> = {
  initialFields: T;
  formName: string;
  onSubmit?: t.OnSubmit<T>;
};

export type FormiControllerAny = FormiController<d.FormiDefAny>;

export const FormiController = (() => {
  return Object.assign(create, {});

  function create<T extends d.FormiDefAny>(options: FormiControllerOptions<T>): FormiController<T> {
    const formName = Path.validatePathItem(options.formName);

    let onSubmit: t.OnSubmit<T> | null = options.onSubmit ?? null;
    let formEl: HTMLFormElement | null = null;

    const self: FormiController<T> = {
      [IS_FORM_CONTROLLER]: true,
      formName,
      setOnSubmit,
      register,
      validate,
      findFieldByKeyOrThrow,
      subscribe: notInitialized,
      getState: notInitialized,
    };
    const store = FormiStore(self, options.initialFields);
    Object.assign(self, {
      subscribe: store.subscribe,
      getState: store.getState,
    });
    return self;

    function notInitialized(): never {
      throw new Error('FormiController is not initialized');
    }

    function findFieldByKeyOrThrow(key: FormiKey): f.FormiFieldAny {
      return f.FormiField.findFieldByKeyOrThrow(store.getState().fields, key);
    }

    function setOnSubmit(newOnSubmit: t.OnSubmit<T>) {
      onSubmit = newOnSubmit;
    }

    function validate() {
      const form = getForm();
      const data = new FormData(form);
      store.dispatch({ type: 'Validate', data });
    }

    function getForm() {
      if (!formEl) {
        throw new Error('[react-formi]: Form ref not passed');
      }
      return formEl;
    }

    function handleSubmit(event: SubmitEvent) {
      const form = getForm();
      const data = new FormData(form);
      store.dispatch({ type: 'FormSubmit', data });
      if (store.hasErrors()) {
        console.log('preventDefault');
        event.preventDefault();
        return;
      }
      const values = store.getValues();
      if (onSubmit) {
        onSubmit(
          values,
          {
            stopPropagation: () => event.stopPropagation(),
            preventDefault: () => event.preventDefault(),
            reset: () => form.reset(),
          },
          self
        );
        console.log(onSubmit);
      }
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
      store.dispatch({ type: 'FieldChange', name, data });
    }

    function register(newFormEl: HTMLFormElement) {
      if (formEl && formEl !== newFormEl) {
        unregister();
      }
      formEl = newFormEl;
      formEl.addEventListener('submit', handleSubmit);
      formEl.addEventListener('change', handleChange);
      const data = new FormData(formEl);
      store.dispatch({ type: 'Mount', data });
    }

    function unregister() {
      if (formEl) {
        formEl.removeEventListener('submit', handleSubmit);
        formEl.removeEventListener('change', handleChange);
      }
    }
  }
})();
