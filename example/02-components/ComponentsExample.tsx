import React from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src';
import { TextInput } from './TextInput';

/**
 * 1. Define the form schema
 */
const simpleFields = {
  username: FormiField.string().zodValidate(z.string().min(1).max(20)),
  email: FormiField.string().zodValidate(z.string().email()),
  password: FormiField.string().zodValidate(z.string().min(8)),
};

export function ComponentsExample() {
  /**
   * 2. Use the useFormi hook to create a form instance
   */
  const { fields, Form } = useFormi({
    initialFields: simpleFields,
    formName: 'components',
    onSubmit: ({ value }, actions) => {
      // [Optional] Do something with the form value
      alert(JSON.stringify(value, null, 4));
      // [Optional] Don't submit the form to the server
      actions.preventDefault();
      // [Optional] Reset the form
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
      <TextInput label="Username" field={fields.username} type="text" defaultValue="my-username" />
      <TextInput label="Email" field={fields.email} type="email" />
      <TextInput label="Password" field={fields.password} type="password" />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
