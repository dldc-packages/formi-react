import { PathsCache } from './PathsCache';
import { Path } from './types';

function cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
  const copy = new Map();
  for (const entry of map) {
    copy.set(entry[0], entry[1]);
  }
  return copy;
}

export class ReadonlyPathMap<V> {
  static empty<V>(cache: PathsCache = new PathsCache()): ReadonlyPathMap<V> {
    return new ReadonlyPathMap(new Map(), cache);
  }

  static fromMap<V>(map: Map<Path, V>): ReadonlyPathMap<V> {
    return new ReadonlyPathMap(cloneMap(map), new PathsCache());
  }

  static fromEntries<V>(
    entries: Array<[path: Path, value: V]>,
    cache: PathsCache = new PathsCache()
  ): ReadonlyPathMap<V> {
    return ReadonlyPathMap.empty<V>(cache).setEntries(entries);
  }

  private constructor(private data: Map<Path, V>, private cache: PathsCache) {}

  path<P extends Path>(path: P): P {
    return this.cache.get(path);
  }

  has(path: Path): boolean {
    return this.data.has(this.path(path));
  }

  get(path: Path): V | undefined {
    return this.data.get(this.path(path));
  }

  getChildren(path: Path): Array<[path: Path, value: V]> {
    const childPaths = this.cache.getChildren(path);
    const result: Array<[path: Path, value: V]> = [];
    for (const childPath of childPaths) {
      if (this.has(childPath)) {
        result.push([childPath, this.getOrThrow(childPath)]);
      }
    }
    return result;
  }

  getAll(): Array<[path: Path, value: V]> {
    return Array.from(this.data.entries());
  }

  getOr<Val = V>(path: Path, defaultVal: Val): Val | V {
    const p = this.path(path);
    if (this.has(p)) {
      return this.get(p) as any;
    }
    return defaultVal;
  }

  getOrThrow(path: Path): V {
    const p = this.path(path);
    if (this.has(p) === false) {
      throw new Error(`Unexpected missing [${p.join(',')}] in ReadonlyPathMap`);
    }
    return this.get(p) as any;
  }

  setEntries(entries: Array<[path: Path, value: V]>): ReadonlyPathMap<V> {
    let changed = false;
    const copy = cloneMap(this.data);
    for (const [path, value] of entries) {
      const p = this.path(path);
      if (copy.has(p) === false || copy.get(p) !== value) {
        changed = true;
        copy.set(p, value);
      }
    }
    if (changed === false) {
      return this;
    }
    return new ReadonlyPathMap(copy, this.cache);
  }

  set(path: Path, val: V): ReadonlyPathMap<V> {
    const p = this.path(path);
    if (this.data.get(p) === val) {
      return this;
    }
    const copy = cloneMap(this.data);
    copy.set(p, val);
    return new ReadonlyPathMap(copy, this.cache);
  }

  update(path: Path, updater: (prev: V | undefined) => V): ReadonlyPathMap<V> {
    const p = this.path(path);
    const prev = this.data.get(p);
    const next = updater(prev);
    if (next === prev) {
      return this;
    }
    return this.set(p, next);
  }

  updateAll(updater: (prev: V) => V): ReadonlyPathMap<V> {
    const all = this.getAll();
    const nextEntries = all.map(([path, state]): [Path, V] => [path, updater(state)]);
    return this.setEntries(nextEntries);
  }

  updateIfExist(path: Path, updater: (prev: V) => V): ReadonlyPathMap<V> {
    const p = this.path(path);
    if (this.data.has(p) === false) {
      return this;
    }
    return this.update(p, updater as any);
  }

  updateOrThrow(path: Path, updater: (prev: V) => V): ReadonlyPathMap<V> {
    const p = this.path(path);
    if (this.data.has(p) === false) {
      throw new Error(`Unexpected missing [${p.join(',')}] in ReadonlyPathMap`);
    }
    return this.update(p, updater as any);
  }

  delete(path: Path): ReadonlyPathMap<V> {
    const p = this.path(path);
    if (this.data.has(p) === false) {
      return this;
    }
    const copy = cloneMap(this.data);
    copy.delete(p);
    return new ReadonlyPathMap(copy, this.cache);
  }
}
