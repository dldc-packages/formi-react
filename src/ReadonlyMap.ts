export interface ReadableMap<K, V> {
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => V | undefined;
  readonly getAll: () => Array<[key: K, value: V]>;
  readonly getOr: <Val = V>(key: K, defaultVal: Val) => Val | V;
  readonly getOrThrow: (key: K) => V;
  readonly forEach: (callback: (value: V, key: K) => void) => void;
}

export interface WritableMap<K, V> extends ReadableMap<K, V> {
  readonly setEntries: (entries: Iterable<[key: K, value: V]>) => any;
  readonly set: (key: K, val: V) => any;
  readonly update: (key: K, updater: (prev: V | undefined) => V) => any;
  readonly updateMany: (keys: Array<K>, updater: (prev: V | undefined, key: K) => V) => any;
  readonly updateManyIfExist: (keys: Array<K>, updater: (prev: V, key: K) => V) => any;
  readonly updateAll: (updater: (prev: V, key: K) => V) => any;
  readonly updateIfExist: (key: K, updater: (prev: V) => V) => any;
  readonly updateOrThrow: (key: K, updater: (prev: V) => V) => any;
  readonly delete: (key: K) => any;
}

export class ReadonlyMap<K, V> implements WritableMap<K, V> {
  static empty<K, V>(): ReadonlyMap<K, V> {
    return new ReadonlyMap(new Map());
  }

  static fromMap<K, V>(map: Map<K, V>): ReadonlyMap<K, V> {
    return new ReadonlyMap(cloneMap(map));
  }

  static fromEntries<K, V>(entries: IterableIterator<[K, V]>): ReadonlyMap<K, V> {
    return ReadonlyMap.empty<K, V>().setEntries(entries);
  }

  readonly has: (key: K) => boolean;
  readonly get: (key: K) => V | undefined;
  readonly getAll: () => Array<[key: K, value: V]>;
  readonly getOr: <Val = V>(key: K, defaultVal: Val) => Val | V;
  readonly getOrThrow: (key: K) => V;
  readonly forEach: (callback: (value: V, key: K) => void) => void;

  readonly setEntries: (entries: Iterable<[key: K, value: V]>) => ReadonlyMap<K, V>;
  readonly set: (key: K, val: V) => ReadonlyMap<K, V>;
  readonly update: (key: K, updater: (prev: V | undefined) => V) => ReadonlyMap<K, V>;
  readonly updateMany: (keys: Array<K>, updater: (prev: V | undefined, key: K) => V) => ReadonlyMap<K, V>;
  readonly updateManyIfExist: (keys: Array<K>, updater: (prev: V, key: K) => V) => ReadonlyMap<K, V>;
  readonly updateAll: (updater: (prev: V, key: K) => V) => ReadonlyMap<K, V>;
  readonly updateIfExist: (key: K, updater: (prev: V) => V) => ReadonlyMap<K, V>;
  readonly updateOrThrow: (key: K, updater: (prev: V) => V) => ReadonlyMap<K, V>;
  readonly delete: (key: K) => ReadonlyMap<K, V>;

  readonly draft: () => ReadonlyMapDraft<K, V>;

  private constructor(data: Map<K, V>) {
    const self = this;

    this.has = has;
    this.get = get;
    this.getAll = getAll;
    this.getOr = getOr;
    this.getOrThrow = getOrThrow;
    this.forEach = forEach;

    this.setEntries = setEntries;
    this.set = set;
    this.update = update;
    this.updateMany = updateMany;
    this.updateManyIfExist = updateManyIfExist;
    this.updateAll = updateAll;
    this.updateIfExist = updateIfExist;
    this.updateOrThrow = updateOrThrow;
    this.delete = deleteItem;

    this.draft = draft;

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

    function setEntries(entries: Iterable<[key: K, value: V]>): ReadonlyMap<K, V> {
      let changed = false;
      const copy = cloneMap(data);
      for (const [key, value] of entries) {
        if (copy.has(key) === false || copy.get(key) !== value) {
          changed = true;
          copy.set(key, value);
        }
      }
      if (changed === false) {
        return self;
      }
      return new ReadonlyMap(copy);
    }

    function set(key: K, val: V): ReadonlyMap<K, V> {
      if (data.get(key) === val) {
        return self;
      }
      const copy = cloneMap(data);
      copy.set(key, val);
      return new ReadonlyMap(copy);
    }

    function update(key: K, updater: (prev: V | undefined) => V): ReadonlyMap<K, V> {
      const prev = data.get(key);
      const next = updater(prev);
      if (next === prev) {
        return self;
      }
      return set(key, next);
    }

    function updateMany(keys: Array<K>, updater: (prev: V | undefined, key: K) => V): ReadonlyMap<K, V> {
      const entries = keys.map((key): [K, V] => [key, updater(data.get(key), key)]);
      return setEntries(entries);
    }

    function updateManyIfExist(keys: Array<K>, updater: (prev: V, key: K) => V): ReadonlyMap<K, V> {
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
        return self;
      }
      return setEntries(entries);
    }

    function updateAll(updater: (prev: V, key: K) => V): ReadonlyMap<K, V> {
      const all = getAll();
      const nextEntries = all.map(([key, state]): [K, V] => [key, updater(state, key)]);
      return setEntries(nextEntries);
    }

    function updateIfExist(key: K, updater: (prev: V) => V): ReadonlyMap<K, V> {
      if (data.has(key) === false) {
        return self;
      }
      return update(key, updater as any);
    }

    function updateOrThrow(key: K, updater: (prev: V) => V): ReadonlyMap<K, V> {
      if (data.has(key) === false) {
        throw new Error(`Unexpected missing [${key}] in ReadonlyMap`);
      }
      return update(key, updater as any);
    }

    function deleteItem(key: K): ReadonlyMap<K, V> {
      if (data.has(key) === false) {
        return self;
      }
      const copy = cloneMap(data);
      copy.delete(key);
      return new ReadonlyMap(copy);
    }

    function draft(): ReadonlyMapDraft<K, V> {
      return new ReadonlyMapDraft<K, V>(data);
    }
  }
}

/**
 * A map that you can mutate then call .commit to get a new immutable map (or the same if nothing changed)
 */
export class ReadonlyMapDraft<K, V> implements WritableMap<K, V> {
  readonly has: (key: K) => boolean;
  readonly get: (key: K) => V | undefined;
  readonly getAll: () => Array<[key: K, value: V]>;
  readonly getOr: <Val = V>(key: K, defaultVal: Val) => Val | V;
  readonly getOrThrow: (key: K) => V;
  readonly forEach: (callback: (value: V, key: K) => void) => void;

  readonly setEntries: (entries: Iterable<[key: K, value: V]>) => void;
  readonly set: (key: K, val: V) => void;
  readonly update: (key: K, updater: (prev: V | undefined) => V) => void;
  readonly updateMany: (keys: Array<K>, updater: (prev: V | undefined, key: K) => V) => void;
  readonly updateManyIfExist: (keys: Array<K>, updater: (prev: V, key: K) => V) => void;
  readonly updateAll: (updater: (prev: V, key: K) => V) => void;
  readonly updateIfExist: (key: K, updater: (prev: V) => V) => void;
  readonly updateOrThrow: (key: K, updater: (prev: V) => V) => void;
  readonly delete: (key: K) => void;

  readonly commit: () => ReadonlyMap<K, V>;

  constructor(source: Map<K, V>) {
    const data = cloneMap(source);

    let commited: ReadonlyMap<K, V> | false = false;
    let changed = false;

    this.has = has;
    this.get = get;
    this.getAll = getAll;
    this.getOr = getOr;
    this.getOrThrow = getOrThrow;
    this.forEach = forEach;

    this.setEntries = withMutations(setEntries);
    this.set = withMutations(set);
    this.update = withMutations(update);
    this.updateMany = withMutations(updateMany);
    this.updateManyIfExist = withMutations(updateManyIfExist);
    this.updateAll = withMutations(updateAll);
    this.updateIfExist = withMutations(updateIfExist);
    this.updateOrThrow = withMutations(updateOrThrow);
    this.delete = withMutations(deleteItem);

    this.commit = commit;

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

    function withMutations<F extends (...args: any[]) => any>(fn: F): F {
      return ((...args: any[]) => {
        if (commited) {
          throw new Error('Cannot mutate a commited ReadonlyMapDraft');
        }
        return fn(...args);
      }) as any;
    }

    function setEntries(entries: Iterable<[key: K, value: V]>): void {
      for (const [key, value] of entries) {
        if (data.has(key) === false || data.get(key) !== value) {
          changed = true;
          data.set(key, value);
        }
      }
    }

    function set(key: K, val: V): void {
      if (data.get(key) === val) {
        return;
      }
      data.set(key, val);
      changed = true;
    }

    function update(key: K, updater: (prev: V | undefined) => V): void {
      const prev = data.get(key);
      const next = updater(prev);
      if (next === prev) {
        return;
      }
      return set(key, next);
    }

    function updateMany(keys: Array<K>, updater: (prev: V | undefined, key: K) => V): void {
      const entries = keys.map((key): [K, V] => [key, updater(data.get(key), key)]);
      return setEntries(entries);
    }

    function updateManyIfExist(keys: Array<K>, updater: (prev: V, key: K) => V): void {
      const entries: Array<[K, V]> = [];
      keys.forEach((key) => {
        const prev = data.get(key);
        if (prev) {
          const next = updater(prev, key);
          if (next !== prev) {
            changed = true;
          }
          entries.push([key, next]);
        }
      });
      if (!changed) {
        return;
      }
      return setEntries(entries);
    }

    function updateAll(updater: (prev: V, key: K) => V): void {
      const all = getAll();
      const nextEntries = all.map(([key, state]): [K, V] => [key, updater(state, key)]);
      return setEntries(nextEntries);
    }

    function updateIfExist(key: K, updater: (prev: V) => V): void {
      if (data.has(key) === false) {
        return;
      }
      return update(key, updater as any);
    }

    function updateOrThrow(key: K, updater: (prev: V) => V): void {
      if (data.has(key) === false) {
        throw new Error(`Unexpected missing [${key}] in ReadonlyMap`);
      }
      return update(key, updater as any);
    }

    function deleteItem(key: K): void {
      if (data.has(key) === false) {
        return;
      }
      const copy = cloneMap(data);
      copy.delete(key);
      changed = true;
    }

    function commit(): ReadonlyMap<K, V> {
      if (!commited) {
        commited = ReadonlyMap.fromEntries(data.entries());
      }
      return commited;
    }
  }
}

function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  const copy = new Map();
  for (const entry of map) {
    copy.set(entry[0], entry[1]);
  }
  return copy;
}
