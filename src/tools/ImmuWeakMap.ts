const IS_IMMU_WEAK_MAP = Symbol('IS_IMMU_WEAK_MAP');

export interface ImmuWeakMap<K extends object, V> {
  readonly [IS_IMMU_WEAK_MAP]: true;
  readonly get: (key: K) => V | undefined;
  readonly getOrThrow: (key: K) => V;
  readonly has: (key: K) => boolean;
  readonly draft: () => ImmuWeakMapDraft<K, V>;
  readonly produce: (update: (draft: ImmuWeakMapDraft<K, V>) => ImmuWeakMap<K, V>) => ImmuWeakMap<K, V>;
}

export const ImmuWeakMap = (() => {
  return Object.assign(create, {
    empty,
  });

  function create<K extends object, V>(data: WeakMap<K, V>): ImmuWeakMap<K, V> {
    const self: ImmuWeakMap<K, V> = {
      [IS_IMMU_WEAK_MAP]: true,
      get,
      getOrThrow,
      has,
      draft,
      produce,
    };
    return self;

    function get(key: K): V | undefined {
      return data.get(key);
    }

    function getOrThrow(key: K): V {
      if (has(key) === false) {
        throw new Error(`Unexpected missing [${key}] in ImmuWeakMap`);
      }
      return get(key) as any;
    }

    function has(key: K): boolean {
      return data.has(key);
    }

    function draft(): ImmuWeakMapDraft<K, V> {
      return ImmuWeakMapDraft(data, self);
    }

    function produce(update: (draft: ImmuWeakMapDraft<K, V>) => ImmuWeakMap<K, V>): ImmuWeakMap<K, V> {
      return update(draft());
    }
  }

  function empty<K extends object, V>(): ImmuWeakMap<K, V> {
    return create<K, V>(new WeakMap());
  }
})();

const IS_IMMU_WEAK_MAP_DRAFT = Symbol('IS_IMMU_WEAK_MAP_DRAFT');

export interface ImmuWeakMapDraft<K extends object, V> {
  readonly [IS_IMMU_WEAK_MAP_DRAFT]: true;
  readonly get: (key: K) => V | undefined;
  readonly getOrThrow: (key: K) => V;
  readonly has: (key: K) => boolean;
  readonly set: (key: K, val: V) => void;
  readonly update: (key: K, updater: (prev: V | undefined) => V) => void;
  readonly updateOrThrow: (key: K, updater: (prev: V) => V) => void;
  readonly delete: (key: K) => void;
  readonly commit: (allKeys: Iterable<K>) => ImmuWeakMap<K, V>;
}

export const ImmuWeakMapDraft = (() => {
  return create;

  function create<K extends object, V>(prev: WeakMap<K, V>, prevParent: ImmuWeakMap<K, V>): ImmuWeakMapDraft<K, V> {
    const deleted = new WeakSet<K>();
    const next = new WeakMap<K, V>();

    let changed = false;

    const self: ImmuWeakMapDraft<K, V> = {
      [IS_IMMU_WEAK_MAP_DRAFT]: true,
      get,
      getOrThrow,
      has,
      set,
      commit,
      delete: doDelete,
      update,
      updateOrThrow,
    };
    return self;

    function update(key: K, updater: (prev: V | undefined) => V): void {
      const prevVal = get(key);
      const nextVal = updater(prevVal);
      set(key, nextVal);
    }

    function updateOrThrow(key: K, updater: (prev: V) => V): void {
      const prevVal = get(key);
      if (prevVal === undefined) {
        throw new Error(`Cannot update non-existing key: ${key}`);
      }
      const nextVal = updater(prevVal);
      set(key, nextVal);
    }

    function get(key: K): V | undefined {
      if (!has(key)) {
        return undefined;
      }
      if (next.has(key)) {
        return next.get(key);
      }
      return prev.get(key);
    }

    function getOrThrow(key: K): V {
      if (has(key) === false) {
        throw new Error(`Unexpected missing [${key}] in ImmuWeakMap`);
      }
      return get(key) as any;
    }

    function has(key: K): boolean {
      if (deleted.has(key)) {
        return false;
      }
      if (next.has(key)) {
        return true;
      }
      return prev.has(key);
    }

    function set(key: K, val: V): void {
      if (deleted.has(key)) {
        deleted.delete(key);
      }
      const prevVal = get(key);
      if (prevVal !== val) {
        changed = true;
        next.set(key, val);
      }
    }

    function doDelete(key: K): void {
      if (prev.has(key)) {
        deleted.add(key);
        changed = true;
      }
      if (next.has(key)) {
        next.delete(key);
      }
    }

    function commit(allKeys: Iterable<K>): ImmuWeakMap<K, V> {
      if (!changed) {
        return prevParent;
      }
      for (const key of allKeys) {
        if (deleted.has(key)) {
          continue;
        }
        if (next.has(key) === false) {
          if (prev.has(key)) {
            next.set(key, prev.get(key)!);
            continue;
          }
        }
      }
      return ImmuWeakMap(next);
    }
  }
})();
