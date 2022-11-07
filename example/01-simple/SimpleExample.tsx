import React, { useId } from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src';
import { IssueBox } from './IssueBox';

/**
 * 1. Define the form schema
 */
const simpleFields = {
  username: FormiField.string().zodValidate(z.string().min(1).max(20)),
  email: FormiField.string().zodValidate(z.string().email()),
  password: FormiField.string().zodValidate(z.string().min(1)),
};

export function SimpleExample() {
  /**
   * 2. Use the useFormi hook to create a form instance
   */
  const { fields, Form, useFieldsState } = useFormi({
    formName: 'simple',
    initialFields: simpleFields,
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
   * 3. Read the state of each field to display validation errors
   */
  const states = useFieldsState(fields);

  const [usernameId, emailId, passwordId] = [useId(), useId(), useId()];

  /**
   * 4. Render the form
   */
  return (
    <Form>
      <h2>Simple</h2>
      <p>This is a basic example of how to use Formi.</p>
      <div className="input">
        <label htmlFor={usernameId}>Username</label>
        <input type="text" id={usernameId} name={states.username.name} defaultValue="my-username" />
        <IssueBox issues={states.username.touchedIssues} />
      </div>
      <div className="input">
        <label htmlFor={emailId}>Email</label>
        <input type="text" id={emailId} name={states.username.name} />
        <IssueBox issues={states.email.touchedIssues} />
      </div>
      <div className="input">
        <label htmlFor={passwordId}>Password</label>
        <input type="password" id={passwordId} name={states.username.name} />
        <IssueBox issues={states.password.touchedIssues} />
      </div>
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
