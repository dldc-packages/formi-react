import { FormiController, FormiField } from '@dldc/formi';
import { useEffect } from 'react';
import { z } from 'zod';
import { useFormi } from '../../src/mod';
import { useAsync } from '../utils/useAsync';
import { TextInput } from './TextInput';

export type UsernameIssue = { kind: 'UsernameAlreadyUsed' };

const fieldsDef = {
  username: FormiField.string().withIssue<UsernameIssue>().zodValidate(z.string().min(1).max(20)),
  email: FormiField.string().zodValidate(z.string().email()),
  password: FormiField.string().zodValidate(z.string().min(3)),
};

const FORM_NAME = 'server';

export function ServerExample() {
  const { status, run } = useAsync(async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = FormiController.validate({ formName: FORM_NAME, initialFields: fieldsDef }, data);
    if (res.success === false) {
      return { success: false, issues: res.issues };
    }
    const { value, fields, customIssues } = res;
    if (value.username === 'user') {
      customIssues.add(fields.username, { kind: 'UsernameAlreadyUsed' });
    }
    if (customIssues.hasIssues()) {
      return { success: false, issues: customIssues.getIssues() };
    }
    return { success: true, value };
  });

  const submitting = status.status === 'pending';

  const { fields, Form, refObject } = useFormi({
    initialFields: fieldsDef,
    formName: FORM_NAME,
    onSubmit: ({ formData }, actions) => {
      actions.preventDefault();
      run(formData);
    },
    issues: status.status === 'resolved' && status.data.success === false ? status.data.issues : undefined,
  });

  useEffect(() => {
    if (!refObject.current) {
      return;
    }
    if (status.status === 'resolved' && status.data.success) {
      refObject.current.reset();
    }
  }, [refObject, status]);

  return (
    <Form>
      <h2>Server</h2>
      <p>
        This example shows how you can do additional validation on the server and how to display server errors in your
        UI.
      </p>
      <TextInput label="Username (try 'user')" field={fields.username} type="text" />
      <TextInput label="Email" field={fields.email} type="email" defaultValue="demo@example.com" />
      <TextInput label="Password" field={fields.password} type="password" />
      <div className="buttons">
        <button type="submit" disabled={submitting}>
          Submit
        </button>
        <button type="reset" disabled={submitting}>
          Reset
        </button>
      </div>
    </Form>
  );
}
