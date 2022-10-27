import React from 'react';
import { z } from 'zod';
import { FormiDef, useFormi } from '../../src';
import { IssueBox } from './IssueBox';

const simpleFields = FormiDef.object({
  username: FormiDef.zodString(z.string().min(1).max(20)),
  email: FormiDef.zodString(z.string().email()),
  password: FormiDef.zodString(z.string().min(1)),
});

export function SimpleExample() {
  const { fields, Form, useFieldsState } = useFormi({
    fields: simpleFields,
    formName: 'simple',
    onSubmit: ({ value }, actions) => {
      alert(JSON.stringify(value, null, 2));
      actions.preventDefault();
      actions.reset();
    },
  });

  const { username, email, password } = fields.children;

  const states = useFieldsState(fields.children);

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
