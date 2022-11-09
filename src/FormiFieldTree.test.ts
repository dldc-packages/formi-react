import { FormiField } from './FormiField';
import { FormiFieldTree } from './FormiFieldTree';

test('Traverse', () => {
  const tree = {
    a: [FormiField.value().use(), FormiField.value().use()],
    b: FormiField.value().use(),
    c: FormiField.group(null).use(),
  };

  const onTraverse = jest.fn();

  FormiFieldTree.traverse(tree, onTraverse);

  const expectedNextFn = expect.any(Function);

  expect(onTraverse).toHaveBeenCalledTimes(4);
  expect(onTraverse).toHaveBeenNthCalledWith(1, tree.a[0], expect.objectContaining({ raw: ['a', 0] }), expectedNextFn);
  expect(onTraverse).toHaveBeenNthCalledWith(2, tree.a[1], expect.objectContaining({ raw: ['a', 1] }), expectedNextFn);
  expect(onTraverse).toHaveBeenNthCalledWith(3, tree.b, expect.objectContaining({ raw: ['b'] }), expectedNextFn);
  expect(onTraverse).toHaveBeenNthCalledWith(4, tree.c, expect.objectContaining({ raw: ['c'] }), expectedNextFn);
});

test('Traverse nested fields', () => {
  const tree = {
    a1: [FormiField.value().use(), FormiField.value().use()],
    a2: FormiField.group({
      b1: FormiField.value().use(),
      b2: FormiField.group(null).use(),
      b3: null,
      b4: null,
    }).use(),
  };

  const onTraverse = jest.fn((_field, _path, next) => {
    next();
    return null;
  });

  FormiFieldTree.traverse(tree, onTraverse);

  expect(onTraverse).toHaveBeenCalledTimes(5);
  const fields = onTraverse.mock.calls.map((args) => args[0]);
  expect(fields).toEqual([tree.a1[0], tree.a1[1], tree.a2, tree.a2.children.b1, tree.a2.children.b2]);
});

test('Find path', () => {
  const tree = {
    a1: [FormiField.value().use(), FormiField.value().use()],
    a2: FormiField.group({
      b1: FormiField.value().use(),
      b2: FormiField.group(null).use(),
      b3: null,
    }).use(),
  };

  expect(FormiFieldTree.fieldPath(tree, tree.a1[0])?.raw).toEqual(['a1', 0]);
  expect(FormiFieldTree.fieldPath(tree, tree.a1[1])?.raw).toEqual(['a1', 1]);
  expect(FormiFieldTree.fieldPath(tree, tree.a2.children.b1)?.raw).toEqual(['a2', 'b1']);
  expect(FormiFieldTree.fieldPath(tree, tree.a2.children.b2)?.raw).toEqual(['a2', 'b2']);
});
