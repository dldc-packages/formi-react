export function expectNever(val: never, inner?: (val: any) => void): never {
  if (inner) {
    inner(val);
  }
  throw new Error('Unexpected Never');
}
