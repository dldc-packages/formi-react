import { FormiField, FormiFieldAny } from './FormiField';
import { Path } from './tools/Path';

export type FormiFieldTree = null | FormiFieldAny | FormiFieldTree[] | { [key: string]: FormiFieldTree };

// export type FormiFieldTreeIssue<Tree extends FormiFieldTree> = Tree extends FormiFieldAny
//   ? FormiFieldIssue<Tree> | FormiFieldTreeIssue<Tree['children']>
//   : Tree extends Array<infer Inner extends FormiFieldTree>
//   ? FormiFieldTreeIssue<Inner>
//   : Tree extends Record<string, FormiFieldAny>
//   ? { [K in keyof Tree]: FormiFieldTreeIssue<Tree[K]> }[keyof Tree]
//   : never;

export type FormiFieldTreeValue<Tree extends FormiFieldTree> = Tree extends FormiField<infer V, any, any>
  ? V
  : Tree extends Array<infer Inner extends FormiFieldTree>
  ? ReadonlyArray<FormiFieldTreeValue<Inner>>
  : Tree extends { [key: string]: FormiFieldAny }
  ? { readonly [K in keyof Tree]: FormiFieldTreeValue<Tree[K]> }
  : null;

export const FormiFieldTree = (() => {
  return {
    traverse,
    findAllByPath,
    fieldPath,
    wrap,
    unwrap,
    getChildren,
    clone,
    restoreFromPaths,
  };

  function wrap(fields: FormiFieldTree): FormiFieldAny {
    if (FormiField.utils.isFormiField(fields)) {
      return fields;
    }
    return FormiField.group(fields);
  }

  function unwrap(fields: FormiFieldAny, wrapped: boolean): FormiFieldTree {
    if (wrapped) {
      return fields.children;
    }
    return fields;
  }

  function traverse<T>(tree: FormiFieldTree, visitor: (field: FormiFieldAny, path: Path, next: () => Array<T>) => T): Array<T> {
    function next(current: FormiFieldTree, base: Path): Array<T> {
      return getChildren(current, base).map(({ item, path }) => {
        return visitor(item, path, () => next(item.children, path));
      });
    }
    return next(tree, Path());
  }

  function getChildren(tree: FormiFieldTree, base: Path): Array<{ path: Path; item: FormiFieldAny }> {
    if (tree === null) {
      return [];
    }
    if (FormiField.utils.isFormiField(tree)) {
      return [{ path: base, item: tree }];
    }
    if (Array.isArray(tree)) {
      return tree.flatMap((item, index) => getChildren(item, base.append(index)));
    }
    return Object.entries(tree).flatMap(([key, item]) => getChildren(item, base.append(key)));
  }

  function fieldPath(tree: FormiFieldTree, field: FormiFieldAny): Path | null {
    const found: Array<Path> = [];
    traverse(tree, (item, path, next) => {
      if (item === field) {
        found.push(path);
      }
      next();
    });
    if (found.length === 0) {
      return null;
    }
    if (found.length > 1) {
      throw new Error(`Field found multiple times in tree`);
    }
    return found[0];
  }

  function getChildrenByKey(tree: FormiFieldTree, key: string | number): FormiFieldTree | null {
    if (tree === null) {
      return null;
    }
    if (FormiField.utils.isFormiField(tree)) {
      return getChildrenByKey(tree.children, key);
    }
    if (Array.isArray(tree)) {
      if (typeof key !== 'number') {
        return null;
      }
      return tree[key] ?? null;
    }
    if (typeof key === 'number') {
      return null;
    }
    return tree[key] ?? null;
  }

  function findAllByPath(tree: FormiFieldTree, path: Path): FormiFieldAny[] | null {
    const pathResolved = Path.from(path);
    let current = tree;
    const fieldList: Array<FormiFieldAny> = [];
    if (FormiField.utils.isFormiField(current)) {
      fieldList.unshift(current);
    }
    for (const pathItem of pathResolved) {
      const next = getChildrenByKey(current, pathItem);
      if (!next) {
        return null;
      }
      current = next;
      if (FormiField.utils.isFormiField(current)) {
        fieldList.unshift(current);
      }
    }
    return fieldList;
  }

  function clone<Tree extends FormiFieldTree>(tree: Tree): Tree {
    if (tree === null) {
      return tree;
    }
    if (FormiField.utils.isFormiField(tree)) {
      return tree.clone() as Tree;
    }
    if (Array.isArray(tree)) {
      return tree.map(clone) as Tree;
    }
    return Object.fromEntries(Object.entries(tree).map(([key, value]) => [key, clone(value)])) as Tree;
  }

  function restoreFromPaths<Tree extends FormiFieldTree>(tree: Tree, paths: ReadonlyArray<Path>): Tree {
    if (tree === null) {
      return tree;
    }
    if (FormiField.utils.isFormiField(tree)) {
      const restore = FormiField.utils.getRestoreFromPaths(tree);
      return tree.withChildren((prev: FormiFieldTree) => {
        if (!restore) {
          return restoreFromPaths(prev, paths);
        }
        return restore(paths);
      }) as Tree;
    }
    if (Array.isArray(tree)) {
      const pathsByIndex = new Map<number, Path[]>();
      for (const path of paths) {
        const [index, rest] = path.splitHead();
        if (index === null || typeof index !== 'number') {
          continue;
        }
        let list = pathsByIndex.get(index);
        if (!list) {
          list = [];
          pathsByIndex.set(index, list);
        }
        list.push(rest);
      }
      return tree.map((item, index): FormiFieldTree => {
        const paths = pathsByIndex.get(index) ?? [];
        return restoreFromPaths(item, paths);
      }) as Tree;
    }
    // Object
    const pathsByKey = new Map<string, Path[]>();
    for (const path of paths) {
      const [key, rest] = path.splitHead();
      if (key === null || typeof key !== 'string') {
        continue;
      }
      let list = pathsByKey.get(key);
      if (!list) {
        list = [];
        pathsByKey.set(key, list);
      }
      list.push(rest);
    }
    return Object.fromEntries(
      Object.entries(tree).map(([key, value]): [string, FormiFieldTree] => {
        const paths = pathsByKey.get(key) ?? [];
        return [key, restoreFromPaths(value, paths)];
      })
    ) as Tree;
  }
})();
