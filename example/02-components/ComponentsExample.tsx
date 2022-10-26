import React from 'react';
import { z } from 'zod';
import { field, useFormiForm } from '../../src';
import { TextInput } from './TextInput';

const simpleFields = field.object({
  username: field.zodString(z.string().min(1).max(20)),
  email: field.zodString(z.string().email()),
  password: field.zodString(z.string().min(8)),
});

export function ComponentsExample() {
  const { fields, Form } = useFormiForm({
    fields: simpleFields,
    formName: 'simple',
    onSubmit: ({ value }, actions) => {
      alert(JSON.stringify(value, null, 2));
      actions.preventDefault();
      actions.reset();
    },
  });

  return (
    <Form>
      <h2>Components</h2>
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
