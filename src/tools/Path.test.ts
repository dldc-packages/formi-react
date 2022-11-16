import { Path, RawPath } from './Path';

describe('serialize / parse', () => {
  const testCases: Array<[RawPath, string]> = [
    [[], ''],
    [['foo'], 'foo'],
    [['a', 42, 'b'], 'a[42].b'],
    [['a', 'b', 'c'], 'a.b.c'],
    [['a', 'b', 'c', 'd'], 'a.b.c.d'],
    [['a', 1, 'c', 'd'], 'a[1].c.d'],
    [[1, 'c', 'd'], '[1].c.d'],
    [['a', 'b', 'c', 9], 'a.b.c[9]'],
    [[0, 1, 2], '[0][1][2]'],
    [['____'], '____'],
    [['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], 'a.b.c.d.e.f.g.h.i'],
    [['$$', 0, '---'], '$$[0].---'],
  ];

  test.each(testCases)('Path %j serialize to %s', (path, expected) => {
    expect(Path.serialize(path)).toBe(expected);
  });

  test.each(testCases.map(([path, str]): [string, RawPath] => [str, path]))('Parse %s into %j', (str, expected) => {
    expect(Path.parse(str).raw).toEqual(expected);
  });
});

test('Path is iterable', () => {
  const path = Path('a', 42, 'b');
  expect([...path]).toEqual(['a', 42, 'b']);
});

test('Serialize twice', () => {
  const path = Path('a', 42, 'b');
  expect(path.serialize()).toBe('a[42].b');
  expect(path.serialize()).toBe('a[42].b');
});

test('Path is immutable', () => {
  const path = Path('a', 42, 'b');
  expect(path.serialize()).toBe('a[42].b');
  const newPath = path.append('c');
  expect(path.serialize()).toBe('a[42].b');
  expect(newPath.serialize()).toBe('a[42].b.c');
});

test('Path shift', () => {
  const path = Path('a', 42, 'b');
  expect(path.serialize()).toBe('a[42].b');
  const newPath = path.shift();
  expect(path.serialize()).toBe('a[42].b');
  expect(newPath.serialize()).toBe('[42].b');
});

test('Path splitHead', () => {
  const path = Path('a', 42, 'b');
  expect(path.serialize()).toBe('a[42].b');
  const [head, tail] = path.splitHead();
  expect(head).toBe('a');
  expect(tail.serialize()).toBe('[42].b');
});

test('Path splitHead with empty', () => {
  const path = Path();
  expect(path.serialize()).toBe('');
  const [head, tail] = path.splitHead();
  expect(head).toBeNull();
  expect(tail.serialize()).toBe('');
});

test('Path splitHeadOrThrow', () => {
  const path = Path('a', 42, 'b');
  expect(path.serialize()).toBe('a[42].b');
  const [head, tail] = path.splitHeadOrThrow();
  expect(head).toBe('a');
  expect(tail.serialize()).toBe('[42].b');

  const empty = Path();
  expect(() => empty.splitHeadOrThrow()).toThrowError('Cannot split head of empty path');
});

test('Path.equal', () => {
  const path = Path('a', 42, 'b');
  expect(Path.equal(path, path)).toBe(true);
  const path2 = Path('a', 42, 'b');
  expect(Path.equal(path, path2)).toBe(true);
  const path3 = Path('a', 42, 'c');
  expect(Path.equal(path, path3)).toBe(false);
});

test('Path.equal wit array', () => {
  const path = Path('a', 42, 'b');
  expect(Path.equal(path, ['a', 42, 'b'])).toBe(true);
  const path2 = Path('a', 42, 'b');
  expect(Path.equal(path, path2.raw)).toBe(true);
  const path3 = Path('a', 42, 'c');
  expect(Path.equal(path, path3.raw)).toBe(false);
});
