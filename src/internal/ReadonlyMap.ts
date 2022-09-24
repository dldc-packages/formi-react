function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  const copy = new Map();
  for (const entry of map) {
    copy.set(entry[0], entry[1]);
  }
  return copy;
}

export class ReadonlyMap<K, V> {
  static empty<K, V>(): ReadonlyMap<K, V> {
    return new ReadonlyMap(new Map());
  }

  static fromMap<K, V>(map: Map<K, V>): ReadonlyMap<K, V> {
    return new ReadonlyMap(cloneMap(map));
  }

  static fromEntries<K, V>(entries: Array<[key: K, value: V]>): ReadonlyMap<K, V> {
    return ReadonlyMap.empty<K, V>().setEntries(entries);
  }

  private constructor(private data: Map<K, V>) {}

  has(key: K): boolean {
    return this.data.has(key);
  }

  get(key: K): V | undefined {
    return this.data.get(key);
  }

  getAll(): Array<[key: K, value: V]> {
    return Array.from(this.data.entries());
  }

  getOr<Val = V>(key: K, defaultVal: Val): Val | V {
    if (this.has(key)) {
      return this.get(key) as any;
    }
    return defaultVal;
  }

  getOrThrow(key: K): V {
    if (this.has(key) === false) {
      throw new Error(`Unexpected missing [${key}] in ReadonlyMap`);
    }
    return this.get(key) as any;
  }

  setEntries(entries: Array<[key: K, value: V]>): ReadonlyMap<K, V> {
    let changed = false;
    const copy = cloneMap(this.data);
    for (const [key, value] of entries) {
      if (copy.has(key) === false || copy.get(key) !== value) {
        changed = true;
        copy.set(key, value);
      }
    }
    if (changed === false) {
      return this;
    }
    return new ReadonlyMap(copy);
  }

  set(key: K, val: V): ReadonlyMap<K, V> {
    if (this.data.get(key) === val) {
      return this;
    }
    const copy = cloneMap(this.data);
    copy.set(key, val);
    return new ReadonlyMap(copy);
  }

  update(key: K, updater: (prev: V | undefined) => V): ReadonlyMap<K, V> {
    const prev = this.data.get(key);
    const next = updater(prev);
    if (next === prev) {
      return this;
    }
    return this.set(key, next);
  }

  updateAll(updater: (prev: V) => V): ReadonlyMap<K, V> {
    const all = this.getAll();
    const nextEntries = all.map(([path, state]): [K, V] => [path, updater(state)]);
    return this.setEntries(nextEntries);
  }

  updateIfExist(key: K, updater: (prev: V) => V): ReadonlyMap<K, V> {
    if (this.data.has(key) === false) {
      return this;
    }
    return this.update(key, updater as any);
  }

  updateOrThrow(key: K, updater: (prev: V) => V): ReadonlyMap<K, V> {
    if (this.data.has(key) === false) {
      throw new Error(`Unexpected missing [${key}] in ReadonlyMap`);
    }
    return this.update(key, updater as any);
  }

  delete(key: K): ReadonlyMap<K, V> {
    if (this.data.has(key) === false) {
      return this;
    }
    const copy = cloneMap(this.data);
    copy.delete(key);
    return new ReadonlyMap(copy);
  }
}
