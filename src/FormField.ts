import { FormControllerAny } from './FormController';
import { Path, PathLike } from './Path';
import {
  FieldAny,
  FieldKey,
  FieldValueOf_Array,
  FieldValueOf_Object,
  Field_Array,
  Field_Multiple,
  Field_Object,
  Field_Validate,
  Field_Value,
  FORMI_INTERNAL,
  FORMI_TYPES,
  IS_FORMI,
} from './types';

function notImplemented(): never {
  throw new Error('Not implemented');
}

function createFieldKey(controller: FormControllerAny): FieldKey {
  const key: FieldKey = {
    [FORMI_INTERNAL]: true,
    get field() {
      return controller.getState().fields[FORMI_INTERNAL].findByKeyOrThrow(key);
    },
  };
  return key;
}

interface FormFielPrivateApi {
  readonly findByKey: (key: FieldKey) => FormFieldOfAny | null;
  readonly findByKeyOrThrow: (key: FieldKey) => FormFieldOfAny;
  readonly findByPath: (path: PathLike) => FormFieldOfAny | null;
  readonly findByPathOrThrow: (path: PathLike) => FormFieldOfAny;
  readonly getChildren: () => Array<FormFieldOfAny>;
}

export type FormFieldOf<Field extends FieldAny> = Field extends Field_Value<infer V, infer I>
  ? FormField_Value<V, I>
  : Field extends Field_Multiple<infer V, infer I>
  ? FormField_Multiple<V, I>
  : Field extends Field_Validate<infer C, infer V, infer I>
  ? FormField_Validate<C, V, I>
  : Field extends Field_Array<infer C, infer I>
  ? FormField_Array<C, I>
  : Field extends Field_Object<infer C, infer I>
  ? FormField_Object<C, I>
  : never;

export type FormFieldOfAny = FormFieldOf<FieldAny>;

export type FormFieldAny = FormField<any, any>;

export interface FormField<Value, Issue> {
  readonly [IS_FORMI]: true;
  readonly [FORMI_TYPES]: { readonly __value: Value; readonly __issue: Issue };
  readonly [FORMI_INTERNAL]: FormFielPrivateApi;
  readonly controller: FormControllerAny;
  readonly key: FieldKey;
  readonly path: Path;
  readonly id: string;
}

export const FormField = Object.assign(
  function FormField<Value, Issue>(
    key: FieldKey,
    path: Path,
    controller: FormControllerAny,
    internal: FormFielPrivateApi
  ): FormField<Value, Issue> {
    return {
      [IS_FORMI]: true,
      [FORMI_TYPES]: {} as any,
      [FORMI_INTERNAL]: internal,
      controller,
      key,
      path,
      id: Path.serialize([controller.formName, ...path]),
    };
  },
  {
    traverse<T>(formField: FormFieldOfAny, visitor: (field: FormFieldOfAny, next: () => Array<T>) => T): T {
      function next(current: FormFieldOfAny): Array<T> {
        return current[FORMI_INTERNAL].getChildren().map((child) => {
          return visitor(child, () => next(child));
        });
      }
      return visitor(formField, () => next(formField));
    },
    instanceof(field: any, kind?: FormFieldOfAny['kind']): field is FormFieldOfAny {
      if (field && field[IS_FORMI]) {
        const kinds: Record<FormFieldOfAny['kind'], null> = {
          FormField_Value: null,
          FormField_Multiple: null,
          FormField_Validate: null,
          FormField_Array: null,
          FormField_Object: null,
        };
        if (kind) {
          return field.kind === kind;
        }
        return Object.keys(kinds).includes(field.kind);
      }
      return false;
    },
  }
);

export interface FormField_Value_Actions {
  readonly reset: () => void;
  readonly setValue: (value: FormDataEntryValue) => void;
}

export interface FormField_Value<Value, Issue> extends FormField<Value, Issue> {
  readonly kind: 'FormField_Value';
  readonly field: Field_Value<Value, Issue>;
  readonly name: string;
  readonly actions: FormField_Value_Actions;
}

export const FormField_Value = Object.assign(
  function FormField_Value<Value, Issue>(
    key: FieldKey,
    path: Path,
    field: Field_Value<Value, Issue>,
    controller: FormControllerAny
  ): FormField_Value<Value, Issue> {
    const root: FormField_Value<Value, Issue> = {
      ...FormField(key, path, controller, {
        findByKey,
        findByKeyOrThrow: createFindByKeyOrThrow(findByKey),
        findByPath,
        findByPathOrThrow: createFindByPathOrThrow(findByPath),
        getChildren,
      }),
      field,
      kind: 'FormField_Value',
      name: path.serialize(),
      actions: { reset: notImplemented, setValue: notImplemented },
    };
    return root;

    function getChildren(): Array<FormFieldOfAny> {
      return [];
    }

    function findByKey(key: FieldKey): FormFieldOfAny | null {
      if (key === root.key) {
        return root;
      }
      return null;
    }

    function findByPath(path: PathLike): FormFieldOfAny | null {
      if (path.length !== 0) {
        return null;
      }
      return root;
    }
  },
  {
    instanceof(field: any): field is FormField_Value<any, any> {
      return FormField.instanceof(field, 'FormField_Value');
    },
  }
);

export interface FormField_Multiple_Actions {
  readonly reset: () => void;
  readonly setValues: (values: Array<FormDataEntryValue>) => void;
}

export interface FormField_Multiple<Value, Issue> extends FormField<Value, Issue> {
  readonly kind: 'FormField_Multiple';
  readonly name: string;
  readonly actions: FormField_Multiple_Actions;
}

export interface FormField_Validate_Actions {
  readonly reset: () => void;
  readonly setValue: (value: FormDataEntryValue) => void;
}

export interface FormField_Validate<Child extends FieldAny, Value, Issue> extends FormField<Value, Issue> {
  readonly kind: 'FormField_Validate';
  readonly name: string;
  readonly actions: FormField_Validate_Actions;
  readonly children: FormFieldOf<Child>;
}

export interface FormField_Array_Children_Actions {
  readonly reset: () => void;
  readonly push: () => void;
  readonly remove: (index: number) => void;
  readonly unshift: () => void;
}

export type FormField_Array_Children<Children extends Array<FieldAny>> = { [K in keyof Children]: FormFieldOf<Children[K]> } & {
  length: Children['length'];
};

export interface FormField_Array<Children extends Array<FieldAny>, Issue> extends FormField<FieldValueOf_Array<Children>, Issue> {
  readonly kind: 'FormField_Array';
  readonly children: FormField_Array_Children<Children>;
  readonly actions: FormField_Array_Children_Actions;
  readonly get: <K extends keyof Children>(index: number) => FormFieldOf<Children[K & number]>;
}

export type FormField_Object_Children<Children extends Record<string, FieldAny>> = { [K in keyof Children]: FormFieldOf<Children[K]> };

export interface FormField_Object_Actions {
  readonly reset: () => void;
}

export interface FormField_Object<Children extends Record<string, FieldAny>, Issue>
  extends FormField<FieldValueOf_Object<Children>, Issue> {
  readonly kind: 'FormField_Object';
  readonly children: FormField_Object_Children<Children>;
  readonly action: FormField_Object_Actions;
  readonly get: <K extends keyof Children>(key: K) => FormFieldOf<Children[K]>;
}

function createFindByKeyOrThrow(findByKey: (key: FieldKey) => FormFieldOfAny | null) {
  return function findByKeyOrThrow(key: FieldKey): FormFieldOfAny {
    const field = findByKey(key);
    if (!field) {
      throw new Error(`No field found for key ${key}`);
    }
    return field;
  };
}

function createFindByPathOrThrow(findByPath: (path: PathLike) => FormFieldOfAny | null) {
  return function findByPathOrThrow(path: PathLike): FormFieldOfAny {
    const field = findByPath(path);
    if (!field) {
      throw new Error(`No field found with path ${path}`);
    }
    return field;
  };
}

/* 
export abstract class FormField<Value, Issue> {
  public static create = createFormField;

  protected readonly __value!: Value;
  protected readonly __issue!: Issue;

  public abstract readonly [FORMI_INTERNAL]: FormFielPrivateApi;

  readonly field: FieldAny;
  // the controller of the form this field belongs to
  readonly controller: FormControllerAny;
  // unique key for this field
  readonly key: FieldKey;
  // Path
  readonly path: Path;
  // same as name but with the name of the form prepended
  readonly id: string;

  constructor(key: FieldKey, path: Path, field: FieldAny, controller: FormControllerAny) {
    this.key = key;
    this.path = path;
    this.field = field;
    this.id = Path.serialize([controller.formName, ...path]);
    this.controller = controller;
  }
}

export interface FormField_Value_Actions {
  readonly reset: () => void;
  readonly setValue: (value: FormDataEntryValue) => void;
}

export type FormField_ValueAny = FormField_Value<any, any>;

export class FormField_Value<Value, Issue> extends FormField<Value, Issue> {
  readonly kind = 'Value' as const;
  readonly name: string;
  readonly actions: FormField_Value_Actions;

  public readonly [FORMI_INTERNAL]: FormFielPrivateApi;

  constructor(key: FieldKey, path: Path, field: Field_Value<Value, Issue>, controller: FormControllerAny) {
    super(key, path, field, controller);
    const root = this;

    this.name = path.serialize();

    this.actions = { reset: notImplemented, setValue: notImplemented };

    this[FORMI_INTERNAL] = {
      findByKey,
      findByKeyOrThrow: createFindByKeyOrThrow(findByKey),
      findByPath,
      findByPathOrThrow: createFindByPathOrThrow(findByPath),
      getChildren,
      traverse: createTraverse(this),
    };

    function getChildren(): Array<FormFieldOfAny> {
      return [];
    }

    function findByKey(key: FieldKey): FormFieldOfAny | null {
      if (key === root.key) {
        return root;
      }
      return null;
    }

    function findByPath(path: PathLike): FormFieldOfAny | null {
      if (path.length !== 0) {
        return null;
      }
      return root;
    }
  }
}

export interface FormField_Multiple_Actions {
  readonly reset: () => void;
  readonly setValues: (values: Array<FormDataEntryValue>) => void;
}

export type FormField_MultipleAny = FormField_Multiple<any, any>;

export class FormField_Multiple<Value, Issue> extends FormField<Value, Issue> {
  readonly kind = 'Multiple' as const;
  readonly name: string;
  readonly actions: FormField_Multiple_Actions;

  public readonly [FORMI_INTERNAL]: FormFielPrivateApi;

  constructor(key: FieldKey, path: Path, field: Field_Multiple<Value, Issue>, controller: FormControllerAny) {
    super(key, path, field, controller);
    const root = this;

    this.name = path.serialize();

    this.actions = {
      reset: notImplemented,
      setValues: notImplemented,
    };

    this[FORMI_INTERNAL] = {
      findByKey,
      findByKeyOrThrow: createFindByKeyOrThrow(findByKey),
      findByPath,
      findByPathOrThrow: createFindByPathOrThrow(findByPath),
      getChildren,
      traverse: createTraverse(this),
    };

    function getChildren(): Array<FormFieldOfAny> {
      return [];
    }

    function findByKey(key: FieldKey): FormFieldOfAny | null {
      if (key === root.key) {
        return root;
      }
      return null;
    }

    function findByPath(path: PathLike): FormFieldOfAny | null {
      if (path.length !== 0) {
        return null;
      }
      return root;
    }
  }
}

export interface FormField_Validate_Actions {
  readonly reset: () => void;
  readonly setValue: (value: FormDataEntryValue) => void;
}

export type FormField_ValidateAny = FormField_Validate<FieldAny, any, any>;

export class FormField_Validate<Child extends FieldAny, Value, Issue> extends FormField<Value, Issue> {
  readonly kind = 'Validate' as const;
  readonly name: string;
  readonly actions: FormField_Validate_Actions;
  readonly children: FormFieldOf<Child>;

  public readonly [FORMI_INTERNAL]: FormFielPrivateApi;

  constructor(
    key: FieldKey,
    path: Path,
    field: Field_Validate<Child, Value, Issue>,
    controller: FormControllerAny,
    children: FormFieldOf<Child>
  ) {
    super(key, path, field, controller);
    const root = this;

    this.name = path.serialize();
    this.children = children;

    this.actions = { reset: notImplemented, setValue: notImplemented };

    this[FORMI_INTERNAL] = {
      findByKey,
      findByKeyOrThrow: createFindByKeyOrThrow(findByKey),
      findByPath,
      findByPathOrThrow: createFindByPathOrThrow(findByPath),
      getChildren,
      traverse: createTraverse(this),
    };

    function getChildren(): Array<FormFieldOfAny> {
      return [children];
    }

    function findByKey(key: FieldKey): FormFieldOfAny | null {
      if (key === root.key) {
        return root;
      }
      return null;
    }

    function findByPath(path: PathLike): FormFieldOfAny | null {
      if (path.length !== 0) {
        return null;
      }
      return root;
    }
  }
}

interface FormField_Array_Children_Actions {
  readonly reset: () => void;
  readonly push: () => void;
  readonly remove: (index: number) => void;
  readonly unshift: () => void;
}

export type FormField_ArrayAny = FormField_Array<any, any>;

export type FormField_Array_Children<Children extends Array<FieldAny>> = { [K in keyof Children]: FormFieldOf<Children[K]> } & {
  length: Children['length'];
};

export class FormField_Array<Children extends Array<FieldAny>, Issue> extends FormField<FieldValueOf_Array<Children>, Issue> {
  readonly kind = 'Array' as const;
  readonly children: FormField_Array_Children<Children>;
  readonly actions: FormField_Array_Children_Actions;

  readonly get: <K extends keyof Children>(index: number) => FormFieldOf<Children[K & number]>;

  public readonly [FORMI_INTERNAL]: FormFielPrivateApi;

  constructor(
    key: FieldKey,
    path: Path,
    field: Field_Array<Children, Issue>,
    controller: FormControllerAny,
    children: FormField_Array_Children<Children>
  ) {
    super(key, path, field, controller);
    const root = this;

    this.children = children;

    this.get = notImplemented;

    this.actions = {
      reset: notImplemented,
      push: notImplemented,
      remove: notImplemented,
      unshift: notImplemented,
    };

    this[FORMI_INTERNAL] = {
      findByKey,
      findByKeyOrThrow: createFindByKeyOrThrow(findByKey),
      findByPath,
      findByPathOrThrow: createFindByPathOrThrow(findByPath),
      getChildren,
      traverse: createTraverse(this),
    };

    function findByKey(key: FieldKey): FormFieldOfAny | null {
      if (key === root.key) {
        return root;
      }
      for (const child of root.children) {
        const result = child[FORMI_INTERNAL].findByKey(key);
        if (result) {
          return result;
        }
      }
      return null;
    }

    function findByPath(path: PathLike): FormFieldOfAny | null {
      const [key, rest] = Path.from(path).splitHead();
      if (key === null) {
        return root;
      }
      if (typeof key !== 'number') {
        return null;
      }
      const child = root.children[key];
      if (!child) {
        return null;
      }
      return child[FORMI_INTERNAL].findByPath(rest);
    }

    function getChildren(): Array<FormFieldOfAny> {
      return children;
    }
  }
}

export type FormField_Object_Children<Children extends Record<string, FieldAny>> = { [K in keyof Children]: FormFieldOf<Children[K]> };

export interface FormField_Object_Actions {
  readonly reset: () => void;
}

export type FormField_ObjectAny = FormField_Object<any, any>;

export class FormField_Object<Children extends Record<string, FieldAny>, Issue> extends FormField<FieldValueOf_Object<Children>, Issue> {
  readonly kind = 'Object' as const;
  readonly children: FormField_Object_Children<Children>;
  readonly action: FormField_Object_Actions;

  readonly get: <K extends keyof Children>(key: K) => FormFieldOf<Children[K]>;

  public readonly [FORMI_INTERNAL]: FormFielPrivateApi;

  constructor(
    key: FieldKey,
    path: Path,
    field: Field_Object<Children, Issue>,
    controller: FormControllerAny,
    children: FormField_Object_Children<Children>
  ) {
    super(key, path, field, controller);
    const root = this;

    this.children = children;
    const childrenArr = Array.from(Object.values(children));

    this.get = notImplemented;

    this.action = {
      reset: notImplemented,
    };

    this[FORMI_INTERNAL] = {
      findByKey,
      findByKeyOrThrow: createFindByKeyOrThrow(findByKey),
      findByPath,
      findByPathOrThrow: createFindByPathOrThrow(findByPath),
      getChildren,
      traverse: createTraverse(this),
    };

    function findByKey(key: FieldKey): FormFieldOfAny | null {
      if (key === root.key) {
        return root;
      }
      for (const child of Object.values(root.children)) {
        const result = child[FORMI_INTERNAL].findByKey(key);
        if (result) {
          return result;
        }
      }
      return null;
    }

    function findByPath(path: PathLike): FormFieldOfAny | null {
      const [key, rest] = Path.from(path).splitHead();
      if (key === null) {
        return root;
      }
      if (typeof key !== 'string') {
        return null;
      }
      const child = root.children[key];
      if (!child) {
        return null;
      }
      return child[FORMI_INTERNAL].findByPath(rest);
    }

    function getChildren(): Array<FormFieldOfAny> {
      return childrenArr;
    }
  }
}

function createFindByKeyOrThrow(findByKey: (key: FieldKey) => FormFieldOfAny | null) {
  return function findByKeyOrThrow(key: FieldKey): FormFieldOfAny {
    const field = findByKey(key);
    if (!field) {
      throw new Error(`No field found for key ${key}`);
    }
    return field;
  };
}

function createFindByPathOrThrow(findByPath: (path: PathLike) => FormFieldOfAny | null) {
  return function findByPathOrThrow(path: PathLike): FormFieldOfAny {
    const field = findByPath(path);
    if (!field) {
      throw new Error(`No field found with path ${path}`);
    }
    return field;
  };
}

function createTraverse(root: FormFieldOfAny) {
  return function traverse<T>(visitor: (field: FormFieldOfAny, next: () => Array<T>) => T): T {
    function next(current: FormFieldOfAny): Array<T> {
      return current[FORMI_INTERNAL].getChildren().map((child) => {
        return visitor(child, () => next(child));
      });
    }
    return visitor(root, () => next(root));
  };
}

function createFormField<Field extends FieldAny>(controller: FormControllerAny, field: Field, path: Path): FormFieldOfAny {
  const key = createFieldKey(controller);
  if (field.kind === 'Value') {
    return new FormField_Value(key, path, field, controller);
  }
  if (field.kind === 'Multiple') {
    return new FormField_Multiple(key, path, field, controller);
  }
  if (field.kind === 'Validate') {
    const children = createFormField(controller, field.child, path.append('_'));
    return new FormField_Validate(key, path, field, controller, children);
  }
  if (field.kind === 'Array') {
    const children: Array<FormFieldOfAny> = [];
    field.children.forEach((child, index) => {
      children.push(FormField.create(controller, child, path.append(index)));
    });
    return new FormField_Array(key, path, field, controller, children);
  }
  if (field.kind === 'Object') {
    const key = createFieldKey(controller);
    const children: Record<string, FormFieldOfAny> = {};
    Object.entries(field.children).forEach(([key, child]) => {
      Path.validatePathItem(key);
      children[key] = FormField.create(controller, child as FieldAny, path.append(key));
    });
    return new FormField_Object(key, path, field, controller, children);
  }
  return expectNever(field, () => {
    throw new Error('Unsupported field type');
  });
}
*/
