import { FormiInternalErrors } from './FormiError';

export const nanoid = (() => {
  // https://github.com/ai/nanoid/blob/main/non-secure/index.js
  const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

  return nanoid;

  function nanoid(size = 21) {
    let id = '';
    // A compact alternative for `for (var i = 0; i < step; i++)`.
    let i = size;
    while (i--) {
      // `| 0` is more compact and faster than `Math.floor()`.
      id += urlAlphabet[(Math.random() * 64) | 0];
    }
    return id;
  }
})();

export function expectNever(val: never, inner?: (val: any) => void): never {
  if (inner) {
    inner(val);
  }
  throw FormiInternalErrors.create.Internal_UnexpectedNever(val);
}

export function shallowEqual(left: any, right: any): boolean {
  if (left instanceof File || right instanceof File) {
    // never compare files)
    return false;
  }
  if (left === right) {
    return true;
  }
  if (left === undefined || right === undefined || left === null || right === null || typeof left !== typeof right) {
    return false;
  }
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    for (let i = 0; i < left.length; i++) {
      if (left[i] !== right[i]) {
        return false;
      }
    }
    return true;
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }
  return true;
}

export function isSetEqual<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean {
  if (left.size !== right.size) {
    return false;
  }
  for (const val of left) {
    if (!right.has(val)) {
      return false;
    }
  }
  return true;
}
