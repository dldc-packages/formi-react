const IS_READABLE_IMMU_MAP = Symbol('IS_READABLE_IMMU_MAP');

export interface ReadableImmuMap<K, V> {
  readonly [IS_READABLE_IMMU_MAP]: true;
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => V | undefined;
  readonly entries: () => IterableIterator<[key: K, value: V]>;
  readonly getAll: () => Array<[key: K, value: V]>;
  readonly getOr: <Val = V>(key: K, defaultVal: Val) => Val | V;
  readonly getOrThrow: (key: K) => V;
  readonly forEach: (callback: (value: V, key: K) => void) => void;
}

export const ReadableImmuMap = (() => {
  return Object.assign(create, {});

  function create<K, V>(data: Map<K, V>): ReadableImmuMap<K, V> {
    const self: ReadableImmuMap<K, V> = {
      [IS_READABLE_IMMU_MAP]: true,
      has,
      get,
      entries,
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

    function entries(): IterableIterator<[key: K, value: V]> {
      return data.entries();
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

const IS_WRITABLE_IMMU_MAP = Symbol('IS_WRITABLE_IMMU_MAP');

export interface WritableImmuMap<K, V, O> extends ReadableImmuMap<K, V> {
  readonly [IS_WRITABLE_IMMU_MAP]: true;
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

export interface WritableImmuMapOptions<K, V, O> {
  immutable: boolean;
  getCurrent: () => O;
  createOutput: (data: Map<K, V>) => O;
  onMutate?: () => void;
}

export const WritableImmuMap = (() => {
  return Object.assign(create, {});

  function create<K, V, O>(
    data: Map<K, V>,
    { immutable, createOutput, getCurrent, onMutate }: WritableImmuMapOptions<K, V, O>
  ): WritableImmuMap<K, V, O> {
    const readable = ReadableImmuMap(data);
    const self: WritableImmuMap<K, V, O> = {
      ...readable,
      [IS_WRITABLE_IMMU_MAP]: true,
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
      if (immutable === false) {
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
      onMutate?.();
      return createOutput(copy);
    }

    function set(key: K, val: V): O {
      if (data.get(key) === val) {
        return getCurrent();
      }
      const copy = cloneMap(data);
      copy.set(key, val);
      onMutate?.();
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
      onMutate?.();
      return createOutput(copy);
    }
  }
})();

const IS_IMMUTABLE_IMMU_MAP = Symbol('IS_IMMUTABLE_IMMU_MAP');

export interface ImmutableImmuMap<K, V> extends WritableImmuMap<K, V, ImmutableImmuMap<K, V>> {
  readonly [IS_IMMUTABLE_IMMU_MAP]: true;
  readonly draft: () => ImmutableImmuMapDraft<K, V>;
  readonly produce: (run: (draft: ImmutableImmuMapDraft<K, V>) => void) => ImmutableImmuMap<K, V>;
}

export const ImmutableImmuMap = (() => {
  return Object.assign(empty, {
    fromMap,
    fromEntries,
    empty,
  });

  function create<K, V>(data: Map<K, V>): ImmutableImmuMap<K, V> {
    const readable = ReadableImmuMap(data);
    const writable = WritableImmuMap(data, {
      immutable: true,
      getCurrent: () => self,
      createOutput: (data) => create(data),
    });

    const self: ImmutableImmuMap<K, V> = {
      ...readable,
      ...writable,
      [IS_IMMUTABLE_IMMU_MAP]: true,
      draft,
      produce,
    };

    return self;

    function draft(): ImmutableImmuMapDraft<K, V> {
      return ImmutableImmuMapDraft<K, V>(data);
    }

    function produce(run: (draft: ImmutableImmuMapDraft<K, V>) => void): ImmutableImmuMap<K, V> {
      const draft = self.draft();
      run(draft);
      if (draft.changed) {
        return draft.commit();
      }
      return self;
    }
  }

  function fromMap<K, V>(map: Map<K, V>): ImmutableImmuMap<K, V> {
    return create(new Map(map));
  }

  function fromEntries<K, V>(entries: IterableIterator<[K, V]>): ImmutableImmuMap<K, V> {
    return ImmutableImmuMap.empty<K, V>().setEntries(entries);
  }

  function empty<K, V>(): ImmutableImmuMap<K, V> {
    return create(new Map());
  }
})();

const IS_IMMUTABLE_IMMU_MAP_DRAFT = Symbol('IS_IMMUTABLE_IMMU_MAP_DRAFT');

export interface ImmutableImmuMapDraft<K, V> extends WritableImmuMap<K, V, void> {
  readonly [IS_IMMUTABLE_IMMU_MAP_DRAFT]: true;
  readonly commit: () => ImmutableImmuMap<K, V>;
  readonly changed: boolean;
}

/**
 * A map that you can mutate then call .commit to get a new immutable map (or the same if nothing changed)
 */
export const ImmutableImmuMapDraft = (() => {
  return Object.assign(create, {});

  function create<K, V>(data: Map<K, V>): ImmutableImmuMapDraft<K, V> {
    const localData = new Map(data);

    let commited: ImmutableImmuMap<K, V> | false = false;
    let changed = false;

    const readable = ReadableImmuMap(data);
    const writable = WritableImmuMap(localData, {
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

    const self: ImmutableImmuMapDraft<K, V> = {
      ...readable,
      ...writable,
      [IS_IMMUTABLE_IMMU_MAP_DRAFT]: true,
      commit,
      get changed() {
        return changed;
      },
    };

    return self;

    function commit(): ImmutableImmuMap<K, V> {
      if (!commited) {
        commited = ImmutableImmuMap.fromEntries((changed ? localData : data).entries());
      }
      return commited;
    }
  }
})();
