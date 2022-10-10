import * as t from './types';
import { SubscribeMethod } from 'suub';
import { FormStore } from './FormStore';
import { Path } from './Path';

export type FormControllerOptions<T extends t.FieldAny> = {
  initialFields: T;
  formName: string;
  onSubmit?: t.OnSubmit<T>;
};

// export type UntypedFormController = Omit<FormController<t.FieldAny>, 'setOnSubmit' | 'field'>;

export type FormControllerAny = FormController<t.FieldAny>;

export class FormController<T extends t.FieldAny> {
  public readonly formName: string;

  public readonly setOnSubmit: (onSubmit: t.OnSubmit<T>) => void;
  public readonly register: (formEl: HTMLFormElement) => void;
  public readonly validate: () => void;
  public readonly subscribe: SubscribeMethod<t.FormControllerState>;
  public readonly getState: () => t.FormControllerState;
  // public readonly getFieldByPath: (path: Path) => FormFieldOfAny;
  // public readonly getFieldByKey: (key: t.FieldKey) => FormFieldOfAny;

  constructor(options: FormControllerOptions<T>) {
    const formName = Path.validatePathItem(options.formName);

    const store = new FormStore(this, options.initialFields);

    let onSubmit: t.OnSubmit<T> | null = options.onSubmit ?? null;
    let formEl: HTMLFormElement | null = null;

    const controller = this;

    this.formName = formName;

    this.setOnSubmit = setOnSubmit;
    this.register = register;
    this.subscribe = store.subscribe;
    this.getState = store.getState;
    this.validate = validate;
    // this.getFieldByPath = getFieldByPath;
    // this.getFieldByKey = getFieldByKey;

    // function getFieldByKey(key: t.FieldKey): FormFieldOfAny {
    //   return store.getState().fields.findByKeyOrThrow(key);
    // }

    // function getFieldByPath(path: Path): FormFieldOfAny {
    //   return store.getState().fields.findByPathOrThrow(path);
    // }

    // function createFieldActions<Def extends t.FieldDefAny>(fieldDef: Def): t.FieldActions<Def> {
    //   if (fieldDef.kind === 'Value') {
    //     const result: t.FieldActions<t.FieldDefValueAny> = {
    //       reset: () => {
    //         throw new Error('Not implemented');
    //       },
    //       setValue: () => {
    //         throw new Error('Not implemented');
    //       },
    //     };
    //     return result as any;
    //   }
    //   if (fieldDef.kind === 'Multiple') {
    //     const result: t.FieldActions<t.FieldDefMultipleAny> = {
    //       reset: () => {
    //         throw new Error('Not implemented');
    //       },
    //       append: () => {
    //         throw new Error('Not implemented');
    //       },
    //     };
    //     return result as any;
    //   }
    //   if (fieldDef.kind === 'Array') {
    //     const result: t.FieldActions<t.FieldDefArray<any>> = {
    //       remove: (index) => {
    //         console.log(index);
    //         throw new Error('Not implemented');
    //       },
    //       push: () => {
    //         throw new Error('Not implemented');
    //       },
    //       unshift: () => {
    //         throw new Error('Not implemented');
    //       },
    //     };
    //     return result as any;
    //   }
    //   if (fieldDef.kind === 'Object') {
    //     const result: t.FieldActions<t.FieldDefObject<any>> = {};
    //     return result as any;
    //   }
    //   return expectNever(fieldDef);
    // }

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
          controller
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
}
