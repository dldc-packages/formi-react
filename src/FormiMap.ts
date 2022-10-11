const IS_READABLE_FORMI_MAP = Symbol('IS_READABLE_FORMI_MAP');

export interface ReadableFormiMap<K, V> {
  readonly [IS_READABLE_FORMI_MAP]: true;
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => V | undefined;
  readonly getAll: () => Array<[key: K, value: V]>;
  readonly getOr: <Val = V>(key: K, defaultVal: Val) => Val | V;
  readonly getOrThrow: (key: K) => V;
  readonly forEach: (callback: (value: V, key: K) => void) => void;
}

export const ReadableFormiMap = (() => {
  return Object.assign(create, {});

  function create<K, V>(data: Map<K, V>): ReadableFormiMap<K, V> {
    const self: ReadableFormiMap<K, V> = {
      [IS_READABLE_FORMI_MAP]: true,
      has,
      get,
      getAll,
      getOr,
      getOrThrow,
      forEach,
    };
    return self;

    function has(key: K): boolean {
      return data.has(key);
    }

    function get(key: K): V | undefined {
      return data.get(key);
    }

    function getAll(): Array<[key: K, value: V]> {
      return Array.from(data.entries());
    }

    function getOr<Val = V>(key: K, defaultVal: Val): Val | V {
      if (has(key)) {
        return get(key) as any;
      }
      return defaultVal;
    }

    function getOrThrow(key: K): V {
      if (has(key) === false) {
        throw new Error(`Unexpected missing [${key}] in ReadonlyMap`);
      }
      return get(key) as any;
    }

    function forEach(callback: (value: V, key: K) => void): void {
      data.forEach(callback);
    }
  }
})();

const IS_WRITABLE_FORMI_MAP = Symbol('IS_WRITABLE_FORMI_MAP');

export interface WritableFormiMap<K, V, O> extends ReadableFormiMap<K, V> {
  readonly [IS_WRITABLE_FORMI_MAP]: true;
  readonly setEntries: (entries: Iterable<[key: K, value: V]>) => O;
  readonly set: (key: K, val: V) => O;
  readonly update: (key: K, updater: (prev: V | undefined) => V) => O;
  readonly updateMany: (keys: Array<K>, updater: (prev: V | undefined, key: K) => V) => O;
  readonly updateManyIfExist: (keys: Array<K>, updater: (prev: V, key: K) => V) => O;
  readonly updateAll: (updater: (prev: V, key: K) => V) => O;
  readonly updateIfExist: (key: K, updater: (prev: V) => V) => O;
  readonly updateOrThrow: (key: K, updater: (prev: V) => V) => O;
  readonly delete: (key: K) => O;
}

export interface WritableFormiMapOptions<K, V, O> {
  immutable: boolean;
  getCurrent: () => O;
  createOutput: (data: Map<K, V>) => O;
  onMutate?: () => void;
}

export const WritableFormiMap = (() => {
  return Object.assign(create, {});

  function create<K, V, O>(
    data: Map<K, V>,
    { immutable: clone, createOutput, getCurrent }: WritableFormiMapOptions<K, V, O>
  ): WritableFormiMap<K, V, O> {
    const readable = ReadableFormiMap(data);
    const self: WritableFormiMap<K, V, O> = {
      ...readable,
      [IS_WRITABLE_FORMI_MAP]: true,
      setEntries,
      set,
      update,
      updateMany,
      updateManyIfExist,
      updateAll,
      updateIfExist,
      updateOrThrow,
      delete: deleteItem,
    };
    return self;

    function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
      if (clone === false) {
        return map;
      }
      return new Map(map);
    }

    function setEntries(entries: Iterable<[key: K, value: V]>): O {
      let changed = false;
      const copy = cloneMap(data);
      for (const [key, value] of entries) {
        if (copy.has(key) === false || copy.get(key) !== value) {
          changed = true;
          copy.set(key, value);
        }
      }
      if (changed === false) {
        return getCurrent();
      }
      return createOutput(copy);
    }

    function set(key: K, val: V): O {
      if (data.get(key) === val) {
        return getCurrent();
      }
      const copy = cloneMap(data);
      copy.set(key, val);
      return createOutput(copy);
    }

    function update(key: K, updater: (prev: V | undefined) => V): O {
      const prev = data.get(key);
      const next = updater(prev);
      if (next === prev) {
        return getCurrent();
      }
      return set(key, next);
    }

    function updateMany(keys: Array<K>, updater: (prev: V | undefined, key: K) => V): O {
      const entries = keys.map((key): [K, V] => [key, updater(data.get(key), key)]);
      return setEntries(entries);
    }

    function updateManyIfExist(keys: Array<K>, updater: (prev: V, key: K) => V): O {
      const entries: Array<[K, V]> = [];
      let changed = false;
      keys.forEach((key) => {
        const prev = data.get(key);
        if (prev) {
          const next = updater(prev, key);
          if (!changed && next !== prev) {
            changed = true;
          }
          entries.push([key, next]);
        }
      });
      if (!changed) {
        return getCurrent();
      }
      return setEntries(entries);
    }

    function updateAll(updater: (prev: V, key: K) => V): O {
      const all = readable.getAll();
      const nextEntries = all.map(([key, state]): [K, V] => [key, updater(state, key)]);
      return setEntries(nextEntries);
    }

    function updateIfExist(key: K, updater: (prev: V) => V): O {
      if (data.has(key) === false) {
        return getCurrent();
      }
      return update(key, updater as any);
    }

    function updateOrThrow(key: K, updater: (prev: V) => V): O {
      if (data.has(key) === false) {
        throw new Error(`Unexpected missing [${key}] in ReadonlyMap`);
      }
      return update(key, updater as any);
    }

    function deleteItem(key: K): O {
      if (data.has(key) === false) {
        return getCurrent();
      }
      const copy = cloneMap(data);
      copy.delete(key);
      return createOutput(copy);
    }
  }
})();

const IS_IMMUTABLE_FORMI_MAP = Symbol('IS_IMMUTABLE_FORMI_MAP');

export interface ImmutableFormiMap<K, V> extends WritableFormiMap<K, V, ImmutableFormiMap<K, V>> {
  readonly [IS_IMMUTABLE_FORMI_MAP]: true;
  readonly draft: () => ImmutableFormiMapDraft<K, V>;
}

export const ImmutableFormiMap = (() => {
  return Object.assign(empty, {
    fromMap,
    fromEntries,
    empty,
  });

  function create<K, V>(data: Map<K, V>): ImmutableFormiMap<K, V> {
    const readable = ReadableFormiMap(data);
    const writable = WritableFormiMap(data, {
      immutable: true,
      getCurrent: () => self,
      createOutput: (data) => create(data),
    });

    const self: ImmutableFormiMap<K, V> = {
      ...readable,
      ...writable,
      [IS_IMMUTABLE_FORMI_MAP]: true,
      draft,
    };

    return self;

    function draft(): ImmutableFormiMapDraft<K, V> {
      return ImmutableFormiMapDraft<K, V>(data);
    }
  }

  function fromMap<K, V>(map: Map<K, V>): ImmutableFormiMap<K, V> {
    return create(new Map(map));
  }

  function fromEntries<K, V>(entries: IterableIterator<[K, V]>): ImmutableFormiMap<K, V> {
    return ImmutableFormiMap.empty<K, V>().setEntries(entries);
  }

  function empty<K, V>(): ImmutableFormiMap<K, V> {
    return create(new Map());
  }
})();

const IS_IMMUTABLE_FORMI_MAP_DRAFT = Symbol('IS_IMMUTABLE_FORMI_MAP_DRAFT');

export interface ImmutableFormiMapDraft<K, V> extends WritableFormiMap<K, V, void> {
  readonly [IS_IMMUTABLE_FORMI_MAP_DRAFT]: true;
  readonly commit: () => ImmutableFormiMap<K, V>;
}

/**
 * A map that you can mutate then call .commit to get a new immutable map (or the same if nothing changed)
 */
export const ImmutableFormiMapDraft = (() => {
  return Object.assign(create, {});

  function create<K, V>(data: Map<K, V>): ImmutableFormiMapDraft<K, V> {
    const localData = new Map(data);

    let commited: ImmutableFormiMap<K, V> | false = false;
    let changed = false;

    const readable = ReadableFormiMap(data);
    const writable = WritableFormiMap(localData, {
      immutable: false,
      getCurrent: () => undefined,
      createOutput: () => undefined,
      onMutate: () => {
        if (commited) {
          throw new Error('Cannot mutate a commited draft');
        }
        changed = true;
      },
    });

    const self: ImmutableFormiMapDraft<K, V> = {
      ...readable,
      ...writable,
      [IS_IMMUTABLE_FORMI_MAP_DRAFT]: true,
      commit,
    };

    return self;

    function commit(): ImmutableFormiMap<K, V> {
      if (!commited) {
        commited = ImmutableFormiMap.fromEntries((changed ? localData : data).entries());
      }
      return commited;
    }
  }
})();
