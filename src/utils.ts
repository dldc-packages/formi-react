export function expectNever(val: never, inner?: (val: any) => void): never {
  if (inner) {
    inner(val);
  }
  throw new Error('Unexpected Never');
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
