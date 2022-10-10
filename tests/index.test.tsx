import React from 'React';
import { z } from 'zod';
import { field, useForm, UseFormResult, zx } from '../src';
import { render } from '@testing-library/react';

test('Basic form', () => {
  const fields = field.object({
    name: field.value(z.string()),
    age: field.value(
      zx.chain(
        zx
          .string()
          .min(1)
          .transform((v) => parseInt(v, 10))
          .refine((val) => Number.isNaN(val) === false, 'Invalid number'),
        zx.number().int().min(18).max(99)
      )
    ),
  });

  let result: UseFormResult<typeof fields> | null = null as any;

  function App() {
    result = useForm({ fields: fields, formName: 'create-user' });

    return (
      <result.Form>
        <input name={result.field('name').name} />
        <input name={result.field('age').name} />
        <button type="submit">Submit</button>
      </result.Form>
    );
  }

  render(<App />);

  expect(result).not.toBe(null);

  if (!result) {
    throw new Error('result is null');
  }

  expect(result.field('age')).toMatchObject({
    name: 'age',
    id: 'create-user.age',
    path: ['age'],
  });
  expect(result.field('age')).toBe(result.field('age'));
});
