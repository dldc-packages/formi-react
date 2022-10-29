import { Path, PathLike } from './tools/Path';
import { expectNever } from './utils';
import { FormiKey } from './FormiKey';
import { FormiDef_Value, FormiDef_Values, FormiDef_Repeat, FormiDef_Object, FormiDefAny } from './FormiDef';
import { FieldsStoreDispatch } from './FieldsStore';

function notImplemented(): never {
  throw new Error('Not implemented');
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
const FORMI_FIELD_DISPATCH = Symbol('FORMI_FIELD_DISPATCH');
const FORMI_FIELD_KEYS = Symbol('FORMI_FIELD_KEYS');
const FORMI_FIELD_TYPES = Symbol('FORMI_FIELD_TYPES');

export type Keys = ReadonlyArray<FormiKey>;

export interface FormiField<Value, Issue> {
  readonly [IS_FORMI_FIELD]: true;
  readonly [FORMI_FIELD_TYPES]: { readonly __value: Value; readonly __issue: Issue };
  readonly [FORMI_FIELD_DISPATCH]: FieldsStoreDispatch;
  readonly [FORMI_FIELD_KEYS]: Keys;
  readonly key: FormiKey;
  readonly path: Path;
  readonly id: string;
}

export const FormiField = (() => {
  return {
    createFromDef,
    create,
    traverse,
    isFormiField,
    findByKey,
    findByKeyOrThrow,
    findByPath,
    findByPathOrThrow,
    findAllByPath,
    getChildren,
    updateIn,
    setPath,
    getDispatch,
    getKeys,
  };

  function create<Value, Issue>(key: FormiKey, path: Path, dispatch: FieldsStoreDispatch, keys: Keys): FormiField<Value, Issue> {
    return {
      [IS_FORMI_FIELD]: true,
      [FORMI_FIELD_TYPES]: {} as any,
      [FORMI_FIELD_DISPATCH]: dispatch,
      [FORMI_FIELD_KEYS]: keys,
      key,
      path,
      id: path.serialize(),
    };
  }

  function createFromDef<Def extends FormiDefAny>(def: Def, path: Path, dispatch: FieldsStoreDispatch): FormiFieldAny {
    const key = FormiKey();
    if (def.kind === 'Value') {
      return FormiField_Value(key, path, dispatch, def);
    }
    if (def.kind === 'Values') {
      return FormiField_Values(key, path, dispatch, def);
    }
    if (def.kind === 'Repeat') {
      const children = Array.from({ length: def.initialCount }, (_, index): FormiFieldAny => {
        return createFromDef(def.children, path.append(index), dispatch);
      });
      return FormiField_Repeat(key, path, dispatch, def, children);
    }
    if (def.kind === 'Object') {
      const key = FormiKey();
      const children: Record<string, FormiFieldAny> = {};
      Object.entries(def.children).forEach(([key, child]) => {
        Path.validatePathItem(key);
        children[key] = createFromDef(child as FormiDefAny, path.append(key), dispatch);
      });
      return FormiField_Object(key, path, dispatch, def, children);
    }
    return expectNever(def, () => {
      throw new Error('Unsupported def type');
    });
  }

  function getKeys(field: FormiFieldAny): Keys {
    return field[FORMI_FIELD_KEYS];
  }

  function getDispatch(field: FormiFieldAny): FieldsStoreDispatch {
    return field[FORMI_FIELD_DISPATCH];
  }

  function setPath(field: FormiFieldAny, path: Path): FormiFieldAny {
    if (Path.equal(field.path, path)) {
      return field;
    }
    if (field.kind === 'Value') {
      return FormiField_Value.clone(field, path);
    }
    if (field.kind === 'Values') {
      return FormiField_Values.clone(field, path);
    }
    if (field.kind === 'Repeat') {
      const children = field.children.map((child, index) => setPath(child, path.append(index)));
      return FormiField_Repeat.clone(field, path, children);
    }
    if (field.kind === 'Object') {
      const children: Record<string, FormiFieldAny> = {};
      Object.entries(field.children).forEach(([key, child]) => {
        children[key] = setPath(child, path.append(key));
      });
      return FormiField_Object.clone(field, path, children);
    }
    return expectNever(field);
  }

  function getChildren(field: FormiFieldAny): Array<FormiFieldAny> {
    if (field.kind === 'Value' || field.kind === 'Values') {
      return [];
    }
    if (field.kind === 'Repeat') {
      return field.children;
    }
    if (field.kind === 'Object') {
      return Object.values(field.children);
    }
    return expectNever(field);
  }

  function findAllByPath(field: FormiFieldAny, path: PathLike): null | Array<FormiFieldAny> {
    const pathResolved = Path.from(path);
    let current = field;
    const fields: Array<FormiFieldAny> = [current];
    for (const pathItem of pathResolved) {
      const next = findByPath(current, [pathItem]);
      if (!next) {
        return null;
      }
      current = next;
      fields.unshift(current);
    }
    return fields;
  }

  function updateIn(field: FormiFieldAny, path: Path, updateFn: (prev: FormiFieldAny) => FormiFieldAny): FormiFieldAny {
    if (path.length === 0) {
      return updateFn(field);
    }
    if (field.kind === 'Value' || field.kind === 'Values') {
      throw new Error('Cannot update value field');
    }
    if (field.kind === 'Repeat') {
      const [index, rest] = path.splitHeadOrThrow();
      const child = field.children[index as number];
      if (child === undefined) {
        return field;
      }
      const updated = FormiField.updateIn(child, rest, updateFn);
      if (updated === child) {
        return field;
      }
      const nextChildren = [...field.children];
      nextChildren[index as number] = updated as any;
      // return create(formName, key, path, dispatch, self.def, nextChildren);
      return FormiField_Repeat(field.key, field.path, field[FORMI_FIELD_DISPATCH], field.def, nextChildren);
    }
    if (field.kind === 'Object') {
      const [childKey, rest] = path.splitHeadOrThrow();
      const child = field.children[childKey as string];
      if (child === undefined) {
        return field;
      }
      const updated = FormiField.updateIn(child, rest, updateFn);
      if (updated === child) {
        return field;
      }
      const nextChildren = { ...field.children };
      (nextChildren as any)[childKey] = updated as any;
      return FormiField_Object(field.key, field.path, field[FORMI_FIELD_DISPATCH], field.def, nextChildren);
    }
    return expectNever(field);
  }

  function findByKeyOrThrow(field: FormiFieldAny, key: FormiKey): FormiFieldAny {
    const result = findByKey(field, key);
    if (!result) {
      throw new Error(`No field found for key ${key}`);
    }
    return result;
  }

  function findByKey(field: FormiFieldAny, key: FormiKey): FormiFieldAny | null {
    if (field.key === key) {
      return field;
    }
    if (field.kind === 'Value') {
      return null;
    }
    if (field.kind === 'Values') {
      return null;
    }
    if (field.kind === 'Repeat') {
      for (const child of field.children) {
        const result = findByKey(child, key);
        if (result) {
          return result;
        }
      }
      return null;
    }
    if (field.kind === 'Object') {
      for (const child of Object.values(field.children)) {
        const result = findByKey(child, key);
        if (result) {
          return result;
        }
      }
      return null;
    }
    return expectNever(field);
  }

  function findByPathOrThrow(field: FormiFieldAny, path: PathLike): FormiFieldAny {
    const result = findByPath(field, path);
    if (!result) {
      throw new Error(`No field found for path ${path}`);
    }
    return result;
  }

  function findByPath(field: FormiFieldAny, path: PathLike): FormiFieldAny | null {
    const [key, rest] = Path.from(path).splitHead();
    if (key === null) {
      return field;
    }
    if (field.kind === 'Value') {
      return null;
    }
    if (field.kind === 'Values') {
      return null;
    }
    if (field.kind === 'Repeat') {
      const child = field.children[key as number];
      if (!child) {
        return null;
      }
      return findByPath(child, rest);
    }
    if (field.kind === 'Object') {
      const child = field.children[key as string];
      if (!child) {
        return null;
      }
      return findByPath(child, rest);
    }
    return expectNever(field);
  }

  function traverse<T>(formiField: FormiFieldAny, visitor: (field: FormiFieldAny, next: () => Array<T>) => T): T {
    function next(current: FormiFieldAny): Array<T> {
      return getChildren(current).map((child) => {
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

export type FormiField_ValueAny = FormiField_Value<any, any>;

export interface FormiField_Value<Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Value';
  readonly def: FormiDef_Value<Value, Issue>;
  readonly name: string;
}

export const FormiField_Value = (() => {
  return Object.assign(create, {
    isFormiField_Value,
    clone,
  });

  function create<Value, Issue>(
    key: FormiKey,
    path: Path,
    dispatch: FieldsStoreDispatch,
    def: FormiDef_Value<Value, Issue>
  ): FormiField_Value<Value, Issue> {
    return {
      ...FormiField.create(key, path, dispatch, [key]),
      def,
      kind: 'Value',
      name: path.serialize(),
    };
  }

  function clone<Value, Issue>(field: FormiField_Value<Value, Issue>, path: Path): FormiField_Value<Value, Issue> {
    return create(field.key, path, field[FORMI_FIELD_DISPATCH], field.def);
  }

  function isFormiField_Value(field: any): field is FormiField_Value<any, any> {
    return FormiField.isFormiField(field, 'Value');
  }
})();

export type FormiField_ValuesAny = FormiField_Values<any, any>;

export interface FormiField_Values<Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Values';
  readonly def: FormiDef_Values<Value, Issue>;
  readonly name: string;
}

export const FormiField_Values = (() => {
  return Object.assign(create, {
    isFormiField_Values,
    clone,
  });

  function create<Value, Issue>(
    key: FormiKey,
    path: Path,
    dispatch: FieldsStoreDispatch,
    def: FormiDef_Values<Value, Issue>
  ): FormiField_Values<Value, Issue> {
    return {
      ...FormiField.create(key, path, dispatch, [key]),
      def,
      kind: 'Values',
      name: path.serialize(),
    };
  }

  function clone<Value, Issue>(field: FormiField_Values<Value, Issue>, path: Path): FormiField_Values<Value, Issue> {
    return create(field.key, path, field[FORMI_FIELD_DISPATCH], field.def);
  }

  function isFormiField_Values(field: any): field is FormiField_Values<any, any> {
    return FormiField.isFormiField(field, 'Values');
  }
})();

export interface FormiField_Repeat_Children_Actions {
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
  return Object.assign(create, {
    isFormiField_Repeat,
    clone,
  });

  function create<Children extends FormiDefAny, Value, Issue>(
    key: FormiKey,
    path: Path,
    dispatch: FieldsStoreDispatch,
    def: FormiDef_Repeat<Children, Value, Issue>,
    children: FormiField_Repeat_Children<Children>
  ): FormiField_Repeat<Children, Value, Issue> {
    const keys = [key, ...children.map(FormiField.getKeys).flat()];
    const self: FormiField_Repeat<Children, Value, Issue> = {
      ...FormiField.create(key, path, dispatch, keys),
      kind: 'Repeat',
      def,
      children,
      actions: { remove, push, unshift },
      get: notImplemented,
    };
    return self;

    function remove(index: number): void {
      dispatch({ kind: 'RepeatAction', path: self.path, action: { kind: 'Remove', index } });
    }

    function push(): void {
      dispatch({ kind: 'RepeatAction', path: self.path, action: { kind: 'Push' } });
    }

    function unshift(): void {
      dispatch({ kind: 'RepeatAction', path: self.path, action: { kind: 'Unshift' } });
    }
  }

  function clone<Children extends FormiDefAny, Value, Issue>(
    field: FormiField_Repeat<Children, Value, Issue>,
    path: Path,
    children: FormiField_Repeat_Children<Children>
  ): FormiField_Repeat<Children, Value, Issue> {
    return create(field.key, path, field[FORMI_FIELD_DISPATCH], field.def, children);
  }

  function isFormiField_Repeat(field: any): field is FormiField_Repeat<any, any, any> {
    return FormiField.isFormiField(field, 'Repeat');
  }
})();

export type FormiField_Object_Children<Children extends Record<string, FormiDefAny>> = {
  [K in keyof Children]: FormiFieldOf<Children[K]>;
};

export interface FormiField_Object<Children extends Record<string, FormiDefAny>, Value, Issue> extends FormiField<Value, Issue> {
  readonly kind: 'Object';
  readonly def: FormiDef_Object<Children, Value, Issue>;
  readonly children: FormiField_Object_Children<Children>;
  readonly get: <K extends keyof Children>(key: K) => FormiFieldOf<Children[K]>;
}

export type FormiField_ObjectAny = FormiField_Object<Record<string, FormiDefAny>, any, any>;

export const FormiField_Object = (() => {
  return Object.assign(create, {
    isFormiField_Object,
    clone,
  });

  function create<Children extends Record<string, FormiDefAny>, Value, Issue>(
    key: FormiKey,
    path: Path,
    dispatch: FieldsStoreDispatch,
    def: FormiDef_Object<Children, Value, Issue>,
    children: FormiField_Object_Children<Children>
  ): FormiField_Object<Children, Value, Issue> {
    const keys = [key, ...Object.values(children).map(FormiField.getKeys).flat()];
    const self: FormiField_Object<Children, Value, Issue> = {
      ...FormiField.create(key, path, dispatch, keys),
      kind: 'Object',
      def: def,
      children,
      get,
    };
    return self;

    function get<K extends keyof Children>(key: K): FormiFieldOf<Children[K]> {
      const child = children[key];
      if (!child) {
        throw new Error(`No such child: ${String(key)}`);
      }
      return child;
    }
  }

  function isFormiField_Object(field: any): field is FormiField_Object<any, any, any> {
    return FormiField.isFormiField(field, 'Object');
  }

  function clone<Children extends Record<string, FormiDefAny>, Value, Issue>(
    field: FormiField_Object<Children, Value, Issue>,
    path: Path,
    children: FormiField_Object_Children<Children>
  ): FormiField_Object<Children, Value, Issue> {
    return create(field.key, path, field[FORMI_FIELD_DISPATCH], field.def, children);
  }
})();
