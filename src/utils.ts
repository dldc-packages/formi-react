export function expectNever(val: never, inner?: (val: any) => void): never {
  if (inner) {
    inner(val);
  }
  throw new Error('Unexpected Never');
}

export type Ref<T> = { current: T };

export function createRef<T>(): Ref<T> {
  let value: null | { current: T } = null;
  return {
    get current() {
      if (value === null) {
        throw new Error('Ref not set');
      }
      return value.current;
    },
    set current(val) {
      if (value !== null) {
        throw new Error('Ref already set');
      }
      value = { current: val };
    },
  };
}
