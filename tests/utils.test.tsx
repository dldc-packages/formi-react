import { RawPath, Path } from '../src';

describe('serialize / parse Path', () => {
  const testCases: Array<[RawPath, string]> = [
    [[], ''],
    [['foo'], 'foo'],
    [['a', 42, 'b'], 'a[42].b'],
    [['a', 'b', 'c'], 'a.b.c'],
    [['a', 'b', 'c', 'd'], 'a.b.c.d'],
    [['a', 1, 'c', 'd'], 'a[1].c.d'],
    [[1, 'c', 'd'], '[1].c.d'],
    [['a', 'b', 'c', 9], 'a.b.c[9]'],
  ];

  test.each(testCases)('Path %j serialize to %s', (path, expected) => {
    expect(Path.serialize(path)).toBe(expected);
  });

  test.each(testCases.map(([path, str]): [string, RawPath] => [str, path]))('Parse %s into %j', (str, expected) => {
    expect(Path.parse(str).raw).toEqual(expected);
  });
});
