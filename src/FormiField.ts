import { Path, PathLike } from './tools/Path';
import { expectNever } from './utils';
import { FormiKey } from './FormiKey';
import { FormiDef_Value, FormiDef_Values, FormiDef_Repeat, FormiDef_Object, FormiDefAny } from './FormiDef';

function notImplemented(): never {
  throw new Error('Not implemented');
}

interface FormiFieldPrivateApi {
  readonly findByKey: (key: FormiKey) => FormiFieldAny | null;
  readonly findByKeyOrThrow: (key: FormiKey) => FormiFieldAny;
  readonly findByPath: (path: PathLike) => FormiFieldAny | null;
  readonly findByPathOrThrow: (path: PathLike) => FormiFieldAny;
  readonly findAllByPath: (path: PathLike) => null | Array<FormiFieldAny>;
  readonly getChildren: () => Array<FormiFieldAny>;
}

export type FormiFieldOf<Def> = Def extends FormiDef_Value<infer V, infer I>
  ? FormiField_Value<V, I>
  : Def extends FormiDef_Values<infer V, infer I>
  ? FormiField_Values<V, I>
  : Def extends FormiDef_Repeat<infer C, infer V, infer I>
  ? FormiField_Repeat<C, V, I>
  : Def extends FormiDef_Object<infer C, infer V, infer I>
  ? FormiField_Object<C, V, I>
  : never;

export type FormiFieldAny = FormiField_ValueAny | FormiField_ValuesAny | FormiField_RepeatAny | FormiField_ObjectAny;

export type FormiFieldKind = FormiFieldAny['kind'];

const IS_FORMI_FIELD = Symbol('IS_FORMI_FIELD');
const FORMI_FIELD_INTERNAL = Symbol('FORMI_FIELD_INTERNAL');
const FORMI_FIELD_TYPES = Symbol('FORMI_FIELD_TYPES');

export interface FormiField<Value, Issue> {
  readonly [IS_FORMI_FIELD]: true;
  readonly [FORMI_FIELD_TYPES]: { readonly __value: Value; readonly __issue: Issue };
  readonly [FORMI_FIELD_INTERNAL]: FormiFieldPrivateApi;
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
    findFieldByPath,
    findFieldByPathOrThrow,
    findAllFieldsByPath,
  });

  function findAllFieldsByPath(formiField: FormiFieldAny, path: PathLike): null | Array<FormiFieldAny> {
    return formiField[FORMI_FIELD_INTERNAL].findAllByPath(path);
  }

  function findFieldByPath(formiField: FormiFieldAny, path: PathLike): FormiFieldAny | null {
    return formiField[FORMI_FIELD_INTERNAL].findByPath(path);
  }

  function findFieldByPathOrThrow(formiField: FormiFieldAny, path: PathLike): FormiFieldAny {
    return formiField[FORMI_FIELD_INTERNAL].findByPathOrThrow(path);
  }

  function findFieldByKeyOrThrow(formiField: FormiFieldAny, key: FormiKey): FormiFieldAny {
    return formiField[FORMI_FIELD_INTERNAL].findByKeyOrThrow(key);
  }

  function create<Value, Issue>(
    formName: string,
    key: FormiKey,
    path: Path,
    internal: Omit<FormiFieldPrivateApi, 'findByKeyOrThrow' | 'findByPathOrThrow' | 'findAllByPath'>
  ): FormiField<Value, Issue> {
    return {
      [IS_FORMI_FIELD]: true,
      [FORMI_FIELD_TYPES]: {} as any,
      [FORMI_FIELD_INTERNAL]: {
        findByKey: internal.findByKey,
        findByKeyOrThrow: createFindByKeyOrThrow(internal.findByKey),
        findByPath: internal.findByPath,
        findByPathOrThrow: createFindByPathOrThrow(internal.findByPath),
        findAllByPath: createFindAllByPathOrThrow(internal.findByPath),
        getChildren: internal.getChildren,
      },
      key,
      path,
      id: Path.serialize([formName, ...path]),
    };
  }

  function createFrom<Def extends FormiDefAny>(formName: string, def: Def, path: Path): FormiFieldAny {
    const key = FormiKey();
    if (def.kind === 'Value') {
      return FormiField_Value(formName, key, path, def);
    }
    if (def.kind === 'Values') {
      return FormiField_Values(formName, key, path, def);
    }
    if (def.kind === 'Repeat') {
      const children = Array.from({ length: def.initialCount }, (_, index): FormiFieldAny => {
        return createFrom(formName, def.children, path.append(index));
      });
      return FormiField_Repeat(formName, key, path, def, children);
    }
    if (def.kind === 'Object') {
      const key = FormiKey();
      const children: Record<string, FormiFieldAny> = {};
      Object.entries(def.children).forEach(([key, child]) => {
        Path.validatePathItem(key);
        children[key] = createFrom(formName, child as FormiDefAny, path.append(key));
      });
      return FormiField_Object(formName, key, path, def, children);
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
        Values: null,
        Repeat: null,
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
  readonly def: FormiDef_Value<Value, Issue>;
  readonly name: string;
  readonly actions: FormiField_Value_Actions;
}

export const FormiField_Value = (() => {
  return Object.assign(create, {
    isFormiField_Value,
  });

  function create<Value, Issue>(
    formName: string,
    key: FormiKey,
    path: Path,
    def: FormiDef_Value<Value, Issue>
  ): FormiField_Value<Value, Issue> {
    const self: FormiField_Value<Value, Issue> = {
      ...FormiField.create(formName, key, path, { findByKey, findByPath, getChildren }),
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

export interface FormiField_Values_Actions {
  readonly reset: () => void;
  readonly setValues: (values: Array<FormDataEntryValue>) => void;
}

export type FormiField_ValuesAny = FormiField_Values<any, any>;

export interface FormiField_Values<Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Values';
  readonly def: FormiDef_Values<Value, Issue>;
  readonly name: string;
  readonly actions: FormiField_Values_Actions;
}

export const FormiField_Values = (() => {
  return Object.assign(create, {
    isFormiField_Values,
  });

  function create<Value, Issue>(
    formName: string,
    key: FormiKey,
    path: Path,
    def: FormiDef_Values<Value, Issue>
  ): FormiField_Values<Value, Issue> {
    const root: FormiField_Values<Value, Issue> = {
      ...FormiField.create(formName, key, path, { findByKey, findByPath, getChildren }),
      def,
      kind: 'Values',
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

  function isFormiField_Values(field: any): field is FormiField_Values<any, any> {
    return FormiField.isFormiField(field, 'Values');
  }
})();

export interface FormiField_Repeat_Children_Actions {
  readonly reset: () => void;
  readonly push: () => void;
  readonly remove: (index: number) => void;
  readonly unshift: () => void;
}

export type FormiField_Repeat_Children<Children extends FormiDefAny> = Array<FormiFieldOf<Children>>;

export interface FormiField_Repeat<Children extends FormiDefAny, Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Repeat';
  readonly def: FormiDef_Repeat<Children, Value, Issue>;
  readonly children: FormiField_Repeat_Children<Children>;
  readonly actions: FormiField_Repeat_Children_Actions;
  readonly get: <K extends keyof Children>(index: number) => FormiFieldOf<Children[K & number]>;
}

export type FormiField_RepeatAny = FormiField_Repeat<FormiDefAny, any, any>;

export const FormiField_Repeat = (() => {
  return Object.assign(create, {});

  function create<Children extends FormiDefAny, Value, Issue>(
    formName: string,
    key: FormiKey,
    path: Path,
    def: FormiDef_Repeat<Children, Value, Issue>,
    children: FormiField_Repeat_Children<Children>
  ): FormiField_Repeat<Children, Value, Issue> {
    const self: FormiField_Repeat<Children, Value, Issue> = {
      ...FormiField.create(formName, key, path, { findByKey, findByPath, getChildren }),
      kind: 'Repeat',
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

export type FormiField_Object_Children<Children extends Record<string, FormiDefAny>> = {
  [K in keyof Children]: FormiFieldOf<Children[K]>;
};

export interface FormiField_Object_Actions {
  readonly reset: () => void;
}

export interface FormiField_Object<Children extends Record<string, FormiDefAny>, Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Object';
  readonly def: FormiDef_Object<Children, Value, Issue>;
  readonly children: FormiField_Object_Children<Children>;
  readonly action: FormiField_Object_Actions;
  readonly get: <K extends keyof Children>(key: K) => FormiFieldOf<Children[K]>;
}

export type FormiField_ObjectAny = FormiField_Object<Record<string, FormiDefAny>, any, any>;

export const FormiField_Object = (() => {
  return Object.assign(create, {});

  function create<Children extends Record<string, FormiDefAny>, Value, Issue>(
    formName: string,
    key: FormiKey,
    path: Path,
    def: FormiDef_Object<Children, Value, Issue>,
    children: FormiField_Object_Children<Children>
  ): FormiField_Object<Children, Value, Issue> {
    const childrenArr = Array.from(Object.values(children));

    const self: FormiField_Object<Children, Value, Issue> = {
      ...FormiField.create(formName, key, path, { findByKey, findByPath, getChildren }),
      kind: 'Object',
      def: def,
      children,
      action: { reset: notImplemented },
      get,
    };
    return self;

    function getChildren(): Array<FormiFieldAny> {
      return childrenArr;
    }

    function get<K extends keyof Children>(key: K): FormiFieldOf<Children[K]> {
      const child = children[key];
      if (!child) {
        throw new Error(`No such child: ${String(key)}`);
      }
      return child;
    }

    function findByKey(key: FormiKey): FormiFieldAny | null {
      if (key === self.key) {
        return self as FormiField_ObjectAny;
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
        return self as FormiField_ObjectAny;
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

function createFindAllByPathOrThrow(findByPath: (path: PathLike) => FormiFieldAny | null) {
  return function findByPathOrThrow(path: PathLike): null | Array<FormiFieldAny> {
    const pathResolved = Path.from(path);
    const root = findByPath([]);
    if (!root) {
      return null;
    }
    let current = root;
    const fields: Array<FormiFieldAny> = [current];
    for (const pathItem of pathResolved) {
      const next = current[FORMI_FIELD_INTERNAL].findByPath([pathItem]);
      if (!next) {
        return null;
      }
      current = next;
      fields.unshift(current);
    }
    return fields;
  };
}
