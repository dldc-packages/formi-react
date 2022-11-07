import { SubscribeMethod } from 'suub';
import { FormiFieldTree, FormiFieldTreeValue } from './FormiFieldTree';
import { FormiIssues } from './FormiIssue';
import { FormiIssuesBuilder } from './FormiIssuesBuilder';
import { FormiState, FormiStore } from './FormiStore';
import { Path } from './tools/Path';

export type OnSubmitActions = {
  preventDefault: () => void;
  stopPropagation: () => void;
  reset: () => void;
};

export type OnSubmit<Tree extends FormiFieldTree> = (
  data: { value: FormiFieldTreeValue<Tree>; formData: FormData },
  actions: OnSubmitActions
) => void;

export type FormiResult<Tree extends FormiFieldTree> =
  | {
      success: true;
      value: FormiFieldTreeValue<Tree>;
      fields: Tree;
      customIssues: FormiIssuesBuilder<unknown>;
    }
  | {
      success: false;
      issues: FormiIssues<unknown>;
      fields: Tree;
      customIssues: FormiIssuesBuilder<unknown>;
    };

export type FieldsUpdateFn<F extends FormiFieldTree> = (fields: F) => F;

const IS_FORM_CONTROLLER = Symbol('IS_FORM_CONTROLLER');

export interface FormiController<Tree extends FormiFieldTree> {
  readonly [IS_FORM_CONTROLLER]: true;
  readonly formName: string;

  readonly getState: () => FormiState;
  readonly subscribe: SubscribeMethod<FormiState>;

  readonly submit: (data: FormData) => void;
  readonly getResult: () => FormiResult<Tree>;
  readonly setIssues: (issues: FormiIssues<any>) => void;
  readonly setOnSubmit: (onSubmit: OnSubmit<Tree>) => void;
  readonly setFields: (update: Tree | ((prev: Tree) => Tree)) => void;

  readonly unmount: () => void;
  readonly mount: (formEl: HTMLFormElement) => void;
}

export type FormiControllerOptions<Tree extends FormiFieldTree> = {
  formName: string;
  initialFields: Tree;
  initialIssues?: FormiIssues<any>;
  onSubmit?: OnSubmit<Tree>;
  validateOnMount?: boolean;
};

export type FormiControllerAny = FormiController<any>;

export const FormiController = (() => {
  return Object.assign(create, { validate });

  function validate<Tree extends FormiFieldTree>(options: FormiControllerOptions<Tree>, data: FormData): FormiResult<Tree> {
    const controller = create<Tree>(options);
    controller.submit(data);
    return controller.getResult();
  }

  function create<Tree extends FormiFieldTree>({
    formName,
    validateOnMount = true,
    initialFields,
    initialIssues,
    onSubmit: userOnSubmit,
  }: FormiControllerOptions<Tree>): FormiController<Tree> {
    Path.validatePathItem(formName);

    let onSubmit: OnSubmit<Tree> | null = userOnSubmit ?? null;
    let formEl: HTMLFormElement | null = null;

    const store = FormiStore(initialFields, initialIssues);

    const self: FormiController<Tree> = {
      [IS_FORM_CONTROLLER]: true,
      formName,

      getState: store.getState,
      subscribe: store.subscribe,

      submit,
      getResult,
      setIssues,
      setOnSubmit,
      setFields,

      mount,
      unmount,
    };

    return self;

    function setOnSubmit(newOnSubmit: OnSubmit<Tree>) {
      onSubmit = newOnSubmit;
    }

    function setIssues(issues: FormiIssues<any>) {
      store.dispatch({ type: 'SetIssues', issues });
    }

    function setFields(fields: Tree | ((prev: Tree) => Tree)) {
      store.dispatch({ type: 'SetFields', fields: fields as any });
    }

    function getResult(): FormiResult<Tree> {
      const { rootField } = store.getState();
      const fields = rootField.children as Tree;
      const customIssues = FormiIssuesBuilder(fields) as FormiIssuesBuilder<unknown>;
      if (store.hasErrors() === false) {
        const value = store.getValueOrThrow();
        return { fields, customIssues, success: true, value };
      }
      const issues = store.getIssuesOrThrow();
      return { fields, customIssues, success: false, issues };
    }

    function getForm() {
      if (!formEl) {
        throw new Error('[react-formi]: Form ref not passed');
      }
      return formEl;
    }

    function submit(data: FormData, actions?: OnSubmitActions) {
      store.dispatch({ type: 'Submit', data });
      if (store.hasErrors()) {
        actions?.preventDefault();
        return;
      }
      const value = store.getValueOrThrow();
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
      if (!name) {
        // ignore inputs without name
        return;
      }
      const data = new FormData(form);
      const fieldPath = Path.from(name);
      const [inputFormName, path] = fieldPath.splitHead();
      if (!inputFormName) {
        // input name does not match formi name -> ignore it
        return;
      }
      if (inputFormName !== formName) {
        // input form name does not match form name -> ignore it
        return;
      }
      const fields = store.getState().rootField;
      const fieldList = FormiFieldTree.findAllByPath(fields, path);
      if (!fieldList) {
        console.warn(`Field not found: ${name}`);
        return;
      }
      store.dispatch({ type: 'Change', data, fieldList });
    }

    function handleReset() {
      const form = getForm();
      const data = new FormData(form);
      store.dispatch({ type: 'Reset', data });
    }

    function mount(newFormEl: HTMLFormElement) {
      if (formEl && formEl !== newFormEl) {
        unmount();
      }
      if (formEl === null) {
        formEl = newFormEl;
        formEl.addEventListener('submit', handleSubmit);
        formEl.addEventListener('change', handleChange);
        formEl.addEventListener('reset', handleReset);
      }
      const data = new FormData(formEl);
      if (validateOnMount) {
        store.dispatch({ type: 'Mount', data });
      }
    }

    function unmount() {
      if (formEl) {
        formEl.removeEventListener('submit', handleSubmit);
        formEl.removeEventListener('change', handleChange);
      }
    }
  }
})();
