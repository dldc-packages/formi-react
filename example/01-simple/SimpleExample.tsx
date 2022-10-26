import React from 'react';
import { z } from 'zod';
import { field, useFormiForm } from '../../src';

const simpleFields = field.object({
  username: field.zodString(z.string().min(1).max(20)),
  email: field.zodString(z.string().email()),
  password: field.zodString(z.string().min(8)),
});

export function SimpleExample() {
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
      <h2>Simple</h2>
      <div style={{ padding: '0.5rem 0' }}>
        <label>Username</label>
        <input type="text" name={fields.get('username').name} defaultValue="my-username" />
      </div>
      <div style={{ padding: '0.5rem 0' }}>
        <label>Email</label>
        <input type="text" name={fields.get('email').name} />
      </div>
      <div style={{ padding: '0.5rem 0' }}>
        <label>Password</label>
        <input type="password" name={fields.get('password').name} />
      </div>
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
