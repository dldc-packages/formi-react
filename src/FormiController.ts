import { SubscribeMethod } from 'suub';
import { FormiErrors } from './FormiError';
import { FormiFieldAny } from './FormiField';
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
  /**
   * Revalidate the given fields.
   * If no fields are given, all fields will be revalidated.
   */
  readonly revalidate: (...fields: FormiFieldAny[]) => void;

  readonly unmount: () => void;
  readonly mount: (formEl: HTMLFormElement) => void;
}

export type FormiControllerOptions<Tree extends FormiFieldTree> = {
  formName: string;
  initialFields: Tree;
  initialIssues?: FormiIssues<any>;
  onSubmit?: OnSubmit<Tree>;
  onReset?: () => void;
  validateOnMount?: boolean;
};

export type FormiControllerAny = FormiController<any>;

export const FormiController = (() => {
  return Object.assign(create, { validate });

  function validate<Tree extends FormiFieldTree>(options: FormiControllerOptions<Tree>, data: FormData): FormiResult<Tree> {
    const formPaths: Path[] = [];
    Array.from(data.keys())
      .map((p) => Path.from(p))
      .forEach((path) => {
        const [formName, fieldPath] = path.splitHead();
        if (formName !== options.formName) {
          return;
        }
        formPaths.push(fieldPath);
      });
    const fields = FormiFieldTree.restoreFromPaths(options.initialFields, formPaths);
    const controller = create<Tree>({ ...options, initialFields: fields });
    controller.submit(data);
    return controller.getResult();
  }

  function create<Tree extends FormiFieldTree>({
    formName,
    validateOnMount = true,
    initialFields,
    initialIssues,
    onSubmit: userOnSubmit,
    onReset: userOnReset,
  }: FormiControllerOptions<Tree>): FormiController<Tree> {
    Path.validatePathItem(formName);

    let onSubmit: OnSubmit<Tree> | null = userOnSubmit ?? null;
    let formEl: HTMLFormElement | null = null;

    const store = FormiStore(formName, initialFields, initialIssues);

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
      revalidate,

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

    function revalidate(...fields: FormiFieldAny[]) {
      const form = getForm();
      const data = new FormData(form);
      store.dispatch({ type: 'Change', data, touched: false, fields: fields.length === 0 ? null : fields });
      return;
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
        throw FormiErrors.create.MissingFormRef(formName);
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
      const input = target as HTMLInputElement;
      const name = input.name;
      if (!name) {
        // ignore inputs without name
        return;
      }
      const fieldPath = Path.from(name);
      const [inputFormName, path] = fieldPath.splitHead();
      if (!inputFormName) {
        // no form name -> ignore it
        return;
      }
      if (inputFormName !== formName) {
        // input form name does not match form name -> ignore it
        return;
      }
      const form = getForm();
      const data = new FormData(form);
      const fields = store.getState().rootField;
      const field = FormiFieldTree.findByPath(fields, path);
      if (!field) {
        console.warn(`Field not found: ${name}`);
        return;
      }
      store.dispatch({ type: 'Change', data, touched: true, fields: [field] });
    }

    function handleReset() {
      const form = getForm();
      const data = new FormData(form);
      store.dispatch({ type: 'Reset', data });
      if (userOnReset) {
        userOnReset();
      }
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
