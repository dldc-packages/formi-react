type Key = string | number;
type Path = Array<Key>;

type Node = {
  value: Path;
  children: Map<Key, Node>;
};

export class PathsCache {
  private root: Node = {
    value: [],
    children: new Map(),
  };

  getOrThrow<P extends Path>(path: P): P {
    const current = this.getNodeAtPath(path, false);
    if (current === null) {
      throw new Error('Cannot find path in cache');
    }
    return current.value as any;
  }

  get<P extends Path>(path: P): P {
    const current = this.getNodeAtPath(path, true);
    return current.value as any;
  }

  getChildren(path: Path): Array<Path> {
    const node = this.getNodeAtPath(path, false);
    if (node === null) {
      return [];
    }
    return Array.from(node.children.values()).map((v) => v.value);
  }

  private getNodeAtPath(path: Path, createIfMissing: true): Node;
  private getNodeAtPath(path: Path, createIfMissing: false): Node | null;
  private getNodeAtPath(path: Path, createIfMissing: boolean): Node | null {
    let current: Node = this.root;
    const currentPath: Path = [];
    for (const key of path) {
      currentPath.push(key);
      let next = current.children.get(key);
      if (!next) {
        if (createIfMissing === false) {
          return null;
        }
        next = {
          value: [...currentPath],
          children: new Map(),
        };
        current.children.set(key, next);
      }
      current = next;
    }
    return current;
  }
}
