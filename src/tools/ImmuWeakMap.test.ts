import { ImmuWeakMap } from './ImmuWeakMap';

test('Create ImmuWeakMap', () => {
  const map = ImmuWeakMap(new WeakMap());
  expect(map).toBeDefined();
  expect(ImmuWeakMap.isImmuWeakMap(map)).toBe(true);
});

test('Mutate with draft', () => {
  type Key = Record<never, any>;
  type Val = number;

  const k1: Key = {};
  const k2: Key = {};
  const k3: Key = {};
  const k4: Key = {};

  const v1 = ImmuWeakMap.empty<Key, Val>();

  const v2 = v1.produce((draft) => {
    expect(draft.get(k1)).toBe(undefined);
    draft.set(k1, 1);
    expect(draft.get(k1)).toBe(1);
    expect(draft.getOrThrow(k1)).toBe(1);
    draft.set(k2, 2);
    draft.set(k3, 3);
    expect(() => draft.updateOrThrow(k4, (prev) => prev + 1)).toThrow();
    expect(() => draft.getOrThrow(k4)).toThrow();
    return draft.commit([k1, k2, k3]);
  });

  const v3 = v2.produce((draft) => {
    draft.updateOrThrow(k1, (prev) => prev + 1);
    draft.update(k2, (prev) => (prev ?? 6) + 2);
    draft.update(k4, (prev) => (prev ?? 6) + 2);

    expect(draft.get(k3)).toBe(3);
    expect(draft.get(k4)).toBe(8);

    draft.delete(k2);
    expect(draft.has(k2)).toBe(false);

    draft.delete(k1);
    draft.set(k1, 2);

    return draft.commit([k1, k2, k3, k4]);
  });

  const v4 = v3.produce((draft) => {
    return draft.commit([k1, k2, k3, k4]);
  });

  expect(v1.get(k1)).toBeUndefined();
  expect(v1.get(k2)).toBeUndefined();
  expect(v1.has(k3)).toBe(false);
  expect(() => v1.getOrThrow(k4)).toThrow();

  expect(v2.get(k1)).toBe(1);
  expect(v2.getOrThrow(k2)).toBe(2);
  expect(v2.get(k3)).toBe(3);

  expect(v3.getOrThrow(k1)).toBe(2);
  expect(v3.has(k2)).toBe(false);
  expect(v3.getOrThrow(k3)).toBe(3);
  expect(v3.getOrThrow(k4)).toBe(8);

  expect(v4).toBe(v3);
});
