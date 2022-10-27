import React from 'react';
import { z } from 'zod';
import { FormiDef, useFormi } from '../../src';
import { TextInput } from './TextInput';

const simpleFields = FormiDef.object({
  username: FormiDef.zodString(z.string().min(1).max(20)),
  email: FormiDef.zodString(z.string().email()),
  password: FormiDef.zodString(z.string().min(8)),
});

export function ComponentsExample() {
  const { fields, Form } = useFormi({
    fields: simpleFields,
    formName: 'components',
    onSubmit: ({ value }, actions) => {
      alert(JSON.stringify(value, null, 2));
      actions.preventDefault();
      actions.reset();
    },
  });

  return (
    <Form>
      <h2>Components</h2>
      <p>
        In this example we use a custom <code>TextInput</code> component. We use <code>useFormiFieldState</code> to get the state of a field
        and display validation errors.
      </p>
      <TextInput label="Username" field={fields.get('username')} type="text" defaultValue="my-username" />
      <TextInput label="Email" field={fields.get('email')} type="email" />
      <TextInput label="Password" field={fields.get('password')} type="password" />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
