import { FormiControllerAny } from './FormiController';
import { Path, PathLike } from './Path';
import type * as d from './FormiDef';
import { expectNever } from './utils';
import { FormiKey } from './FormiKey';

function notImplemented(): never {
  throw new Error('Not implemented');
}

interface FormiFieldPrivateApi {
  readonly findByKey: (key: FormiKey) => FormiFieldAny | null;
  readonly findByKeyOrThrow: (key: FormiKey) => FormiFieldAny;
  readonly findByPath: (path: PathLike) => FormiFieldAny | null;
  readonly findByPathOrThrow: (path: PathLike) => FormiFieldAny;
  readonly getChildren: () => Array<FormiFieldAny>;
}

export type FormiFieldOf<Def> = Def extends d.FormiDef_Value<infer V, infer I>
  ? FormiField_Value<V, I>
  : Def extends d.FormiDef_Multiple<infer V, infer I>
  ? FormiField_Multiple<V, I>
  : Def extends d.FormiDef_Validate<infer C, infer V, infer I>
  ? FormiField_Validate<C, V, I>
  : Def extends d.FormiDef_Array<infer C, infer I>
  ? FormiField_Array<C, I>
  : Def extends d.FormiDef_Object<infer C, infer I>
  ? FormiField_Object<C, I>
  : never;

export type FormiFieldAny =
  | FormiField_ValueAny
  | FormiField_MultipleAny
  | FormiField_ValidateAny
  | FormiField_ArrayAny
  | FormiField_ObjectAny;

export type FormiFieldKind = FormiFieldAny['kind'];

const IS_FORMI_FIELD = Symbol('IS_FORMI_FIELD');
const FORMI_FIELD_INTERNAL = Symbol('FORMI_FIELD_INTERNAL');
const FORMI_FIELD_TYPES = Symbol('FORMI_FIELD_TYPES');

export interface FormiField<Value, Issue> {
  readonly [IS_FORMI_FIELD]: true;
  readonly [FORMI_FIELD_TYPES]: { readonly __value: Value; readonly __issue: Issue };
  readonly [FORMI_FIELD_INTERNAL]: FormiFieldPrivateApi;
  readonly controller: FormiControllerAny;
  readonly key: FormiKey;
  readonly path: Path;
  readonly id: string;
}

export const FormiField = (() => {
  return Object.assign(createFrom, {
    createFrom,
    create,
    traverse,
    isFormiField,
    findFieldByKeyOrThrow,
  });

  function findFieldByKeyOrThrow(formiField: FormiFieldAny, key: FormiKey): FormiFieldAny {
    return formiField[FORMI_FIELD_INTERNAL].findByKeyOrThrow(key);
  }

  function create<Value, Issue>(
    key: FormiKey,
    path: Path,
    controller: FormiControllerAny,
    internal: Omit<FormiFieldPrivateApi, 'findByKeyOrThrow' | 'findByPathOrThrow'>
  ): FormiField<Value, Issue> {
    return {
      [IS_FORMI_FIELD]: true,
      [FORMI_FIELD_TYPES]: {} as any,
      [FORMI_FIELD_INTERNAL]: {
        findByKey: internal.findByKey,
        findByKeyOrThrow: createFindByKeyOrThrow(internal.findByKey),
        findByPath: internal.findByPath,
        findByPathOrThrow: createFindByPathOrThrow(internal.findByPath),
        getChildren: internal.getChildren,
      },
      controller,
      key,
      path,
      id: Path.serialize([controller.formName, ...path]),
    };
  }

  function createFrom<Def extends d.FormiDefAny>(controller: FormiControllerAny, def: Def, path: Path): FormiFieldAny {
    const key = FormiKey(controller);
    if (def.kind === 'Value') {
      return FormiField_Value(key, path, def, controller);
    }
    if (def.kind === 'Multiple') {
      return FormiField_Multiple(key, path, def, controller);
    }
    if (def.kind === 'Validate') {
      const children = createFrom(controller, def.child, path.append('_'));
      return FormiField_Validate(key, path, def, controller, children);
    }
    if (def.kind === 'Array') {
      const children: Array<FormiFieldAny> = [];
      def.children.forEach((child, index) => {
        children.push(createFrom(controller, child, path.append(index)));
      });
      return FormiField_Array(key, path, def, controller, children);
    }
    if (def.kind === 'Object') {
      const key = FormiKey(controller);
      const children: Record<string, FormiFieldAny> = {};
      Object.entries(def.children).forEach(([key, child]) => {
        Path.validatePathItem(key);
        children[key] = createFrom(controller, child as d.FormiDefAny, path.append(key));
      });
      return FormiField_Object(key, path, def, controller, children);
    }
    return expectNever(def, () => {
      throw new Error('Unsupported def type');
    });
  }

  function traverse<T>(formiField: FormiFieldAny, visitor: (field: FormiFieldAny, next: () => Array<T>) => T): T {
    function next(current: FormiFieldAny): Array<T> {
      return current[FORMI_FIELD_INTERNAL].getChildren().map((child) => {
        return visitor(child, () => next(child));
      });
    }
    return visitor(formiField, () => next(formiField));
  }

  function isFormiField(field: any, kind?: FormiFieldKind): field is FormiFieldAny {
    if (field && field[IS_FORMI_FIELD]) {
      const kinds: Record<FormiFieldKind, null> = {
        Value: null,
        Multiple: null,
        Validate: null,
        Array: null,
        Object: null,
      };
      if (kind) {
        return field.kind === kind;
      }
      return Object.keys(kinds).includes(field.kind);
    }
    return false;
  }
})();

export interface FormiField_Value_Actions {
  readonly reset: () => void;
  readonly setValue: (value: FormDataEntryValue) => void;
}

export type FormiField_ValueAny = FormiField_Value<any, any>;

export interface FormiField_Value<Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Value';
  readonly def: d.FormiDef_Value<Value, Issue>;
  readonly name: string;
  readonly actions: FormiField_Value_Actions;
}

export const FormiField_Value = (() => {
  return Object.assign(create, {
    isFormiField_Value,
  });

  function create<Value, Issue>(
    key: FormiKey,
    path: Path,
    def: d.FormiDef_Value<Value, Issue>,
    controller: FormiControllerAny
  ): FormiField_Value<Value, Issue> {
    const self: FormiField_Value<Value, Issue> = {
      ...FormiField.create(key, path, controller, { findByKey, findByPath, getChildren }),
      def,
      kind: 'Value',
      name: path.serialize(),
      actions: { reset: notImplemented, setValue: notImplemented },
    };
    return self;

    function getChildren(): Array<FormiFieldAny> {
      return [];
    }

    function findByKey(key: FormiKey): FormiFieldAny | null {
      if (key === self.key) {
        return self;
      }
      return null;
    }

    function findByPath(path: PathLike): FormiFieldAny | null {
      if (path.length !== 0) {
        return null;
      }
      return self;
    }
  }

  function isFormiField_Value(field: any): field is FormiField_Value<any, any> {
    return FormiField.isFormiField(field, 'Value');
  }
})();

export interface FormiField_Multiple_Actions {
  readonly reset: () => void;
  readonly setValues: (values: Array<FormDataEntryValue>) => void;
}

export type FormiField_MultipleAny = FormiField_Multiple<any, any>;

export interface FormiField_Multiple<Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Multiple';
  readonly def: d.FormiDef_Multiple<Value, Issue>;
  readonly name: string;
  readonly actions: FormiField_Multiple_Actions;
}

export const FormiField_Multiple = (() => {
  return Object.assign(create, {
    isFormiField_Multiple,
  });

  function create<Value, Issue>(
    key: FormiKey,
    path: Path,
    def: d.FormiDef_Multiple<Value, Issue>,
    controller: FormiControllerAny
  ): FormiField_Multiple<Value, Issue> {
    const root: FormiField_Multiple<Value, Issue> = {
      ...FormiField.create(key, path, controller, { findByKey, findByPath, getChildren }),
      def,
      kind: 'Multiple',
      name: path.serialize(),
      actions: { reset: notImplemented, setValues: notImplemented },
    };
    return root;

    function getChildren(): Array<FormiFieldAny> {
      return [];
    }

    function findByKey(key: FormiKey): FormiFieldAny | null {
      if (key === root.key) {
        return root;
      }
      return null;
    }

    function findByPath(path: PathLike): FormiFieldAny | null {
      if (path.length !== 0) {
        return null;
      }
      return root;
    }
  }

  function isFormiField_Multiple(field: any): field is FormiField_Multiple<any, any> {
    return FormiField.isFormiField(field, 'Multiple');
  }
})();

export interface FormiField_Validate_Actions {
  readonly reset: () => void;
  readonly setValue: (value: FormDataEntryValue) => void;
}

export type FormiField_ValidateAny = FormiField_Validate<any, any, any>;

export interface FormiField_Validate<Child extends d.FormiDefAny, Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Validate';
  readonly def: d.FormiDef_Validate<Child, Value, Issue>;
  readonly name: string;
  readonly actions: FormiField_Validate_Actions;
  readonly children: FormiFieldOf<Child>;
}

export const FormiField_Validate = (() => {
  return Object.assign(create, {});

  function create<Child extends d.FormiDefAny, Value, Issue>(
    key: FormiKey,
    path: Path,
    def: d.FormiDef_Validate<Child, Value, Issue>,
    controller: FormiControllerAny,
    children: FormiFieldOf<Child>
  ): FormiField_Validate<Child, Value, Issue> {
    const root: FormiField_Validate<Child, Value, Issue> = {
      ...FormiField.create(key, path, controller, { findByKey, findByPath, getChildren }),
      kind: 'Validate',
      def: def,
      name: path.serialize(),
      actions: { reset: notImplemented, setValue: notImplemented },
      children,
    };
    return root;

    function getChildren(): Array<FormiFieldAny> {
      return [children];
    }

    function findByKey(key: FormiKey): FormiFieldAny | null {
      if (key === root.key) {
        return root;
      }
      return null;
    }

    function findByPath(path: PathLike): FormiFieldAny | null {
      if (path.length !== 0) {
        return null;
      }
      return root;
    }
  }
})();

export interface FormiField_Array_Children_Actions {
  readonly reset: () => void;
  readonly push: () => void;
  readonly remove: (index: number) => void;
  readonly unshift: () => void;
}

export type FormiField_Array_Children<Children extends Array<any>> = { [K in keyof Children]: FormiFieldOf<Children[K]> } & {
  length: Children['length'];
};

export interface FormiField_Array<Children extends Array<any>, Issue> extends FormiField<d.FormiDefValueOf_Array<Children>, Issue> {
  readonly kind: 'Array';
  readonly def: d.FormiDef_Array<Children, Issue>;
  readonly children: FormiField_Array_Children<Children>;
  readonly actions: FormiField_Array_Children_Actions;
  readonly get: <K extends keyof Children>(index: number) => FormiFieldOf<Children[K & number]>;
}

export type FormiField_ArrayAny = FormiField_Array<Array<any>, any>;

export const FormiField_Array = (() => {
  return Object.assign(create, {});

  function create<Children extends Array<d.FormiDefAny>, Issue>(
    key: FormiKey,
    path: Path,
    def: d.FormiDef_Array<Children, Issue>,
    controller: FormiControllerAny,
    children: FormiField_Array_Children<Children>
  ): FormiField_Array<Children, Issue> {
    const self: FormiField_Array<Children, Issue> = {
      ...FormiField.create(key, path, controller, { findByKey, findByPath, getChildren }),
      kind: 'Array',
      def,
      children,
      actions: { reset: notImplemented, push: notImplemented, remove: notImplemented, unshift: notImplemented },
      get: notImplemented,
    };
    return self;

    function getChildren(): Array<FormiFieldAny> {
      return children;
    }

    function findByKey(key: FormiKey): FormiFieldAny | null {
      if (key === self.key) {
        return self;
      }
      for (const child of self.children) {
        const result = child[FORMI_FIELD_INTERNAL].findByKey(key);
        if (result) {
          return result;
        }
      }
      return null;
    }

    function findByPath(path: PathLike): FormiFieldAny | null {
      const [key, rest] = Path.from(path).splitHead();
      if (key === null) {
        return self;
      }
      if (typeof key !== 'number') {
        return null;
      }
      const child = self.children[key];
      if (!child) {
        return null;
      }
      return child[FORMI_FIELD_INTERNAL].findByPath(rest);
    }
  }
})();

export type FormiField_Object_Children<Children extends Record<string, any>> = {
  [K in keyof Children]: FormiFieldOf<Children[K]>;
};

export interface FormiField_Object_Actions {
  readonly reset: () => void;
}

export interface FormiField_Object<Children extends Record<string, any>, Issue>
  extends FormiField<d.FormiDefValueOf_Object<Children>, Issue> {
  readonly kind: 'Object';
  readonly def: d.FormiDef_Object<Children, Issue>;
  readonly children: FormiField_Object_Children<Children>;
  readonly action: FormiField_Object_Actions;
  readonly get: <K extends keyof Children>(key: K) => FormiFieldOf<Children[K]>;
}

export type FormiField_ObjectAny = FormiField_Object<Record<string, any>, any>;

export const FormiField_Object = (() => {
  return Object.assign(create, {});

  function create<Children extends Record<string, d.FormiDefAny>, Issue>(
    key: FormiKey,
    path: Path,
    def: d.FormiDef_Object<Children, Issue>,
    controller: FormiControllerAny,
    children: FormiField_Object_Children<Children>
  ): FormiField_Object<Children, Issue> {
    const childrenArr = Array.from(Object.values(children));

    const self: FormiField_Object<Children, Issue> = {
      ...FormiField.create(key, path, controller, { findByKey, findByPath, getChildren }),
      kind: 'Object',
      def: def,
      children,
      action: { reset: notImplemented },
      get: notImplemented,
    };
    return self;

    function getChildren(): Array<FormiFieldAny> {
      return childrenArr;
    }

    function findByKey(key: FormiKey): FormiFieldAny | null {
      if (key === self.key) {
        return self;
      }
      for (const child of Object.values(self.children)) {
        const result = child[FORMI_FIELD_INTERNAL].findByKey(key);
        if (result) {
          return result;
        }
      }
      return null;
    }

    function findByPath(path: PathLike): FormiFieldAny | null {
      const [key, rest] = Path.from(path).splitHead();
      if (key === null) {
        return self;
      }
      if (typeof key !== 'string') {
        return null;
      }
      const child = self.children[key];
      if (!child) {
        return null;
      }
      return child[FORMI_FIELD_INTERNAL].findByPath(rest);
    }
  }
})();

function createFindByKeyOrThrow(findByKey: (key: FormiKey) => FormiFieldAny | null) {
  return function findByKeyOrThrow(key: FormiKey): FormiFieldAny {
    const field = findByKey(key);
    if (!field) {
      throw new Error(`No field found for key ${key}`);
    }
    return field;
  };
}

function createFindByPathOrThrow(findByPath: (path: PathLike) => FormiFieldAny | null) {
  return function findByPathOrThrow(path: PathLike): FormiFieldAny {
    const field = findByPath(path);
    if (!field) {
      throw new Error(`No field found with path ${path}`);
    }
    return field;
  };
}
