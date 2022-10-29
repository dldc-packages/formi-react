import React from 'react';
import { z } from 'zod';
import { FormiDef, useFormi } from '../../src';
import { IssueBox } from './IssueBox';

/**
 * 1. Define the form schema
 */
const simpleFields = FormiDef.object({
  username: FormiDef.zodString(z.string().min(1).max(20)),
  email: FormiDef.zodString(z.string().email()),
  password: FormiDef.zodString(z.string().min(1)),
});

export function SimpleExample() {
  /**
   * 2. Use the useFormi hook to create a form instance
   */
  const { fields, Form, useFieldsState } = useFormi({
    formName: 'simple',
    fields: simpleFields,
    onSubmit: ({ value }, actions) => {
      // [Optional] Do something with the form value
      alert(JSON.stringify(value, null, 2));
      // [Optional] Don't submit the form to the server
      actions.preventDefault();
      // [Optional] Reset the form
      actions.reset();
    },
  });

  /**
   * 3. Access the fields of your form...
   */
  const { username, email, password } = fields.children;

  /**
   * 4. Read the state of each field to display validation errors
   */
  const states = useFieldsState(fields.children);

  /**
   * 5. Render the form
   */
  return (
    <Form>
      <h2>Simple</h2>
      <p>This is a basic example of how to use Formi.</p>
      <div className="input">
        <label htmlFor={username.id}>Username</label>
        <input type="text" id={username.id} name={username.name} defaultValue="my-username" />
        <IssueBox issues={states.username.touchedIssues} />
      </div>
      <div className="input">
        <label htmlFor={email.id}>Email</label>
        <input type="text" id={email.id} name={email.name} />
        <IssueBox issues={states.email.touchedIssues} />
      </div>
      <div className="input">
        <label htmlFor={password.id}>Password</label>
        <input type="password" id={password.id} name={password.name} />
        <IssueBox issues={states.password.touchedIssues} />
      </div>
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
