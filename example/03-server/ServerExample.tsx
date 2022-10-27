import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { FormiController, useFormi, FormiDef } from '../../src';
import { TextInput } from './TextInput';

export type UsernameIssue = { kind: 'UsernameAlreadyUsed' };

const fieldsDef = FormiDef.object({
  username: FormiDef.zodString<string, UsernameIssue>(z.string().min(1).max(20)),
  email: FormiDef.zodString(z.string().email()),
  password: FormiDef.zodString(z.string().min(3)),
});

const FORM_NAME = 'server';

export function ServerExample() {
  const { status, run } = useAsync(async (data: FormData) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const res = FormiController.validate({ formName: FORM_NAME, fields: fieldsDef }, data);
    if (res.success === false) {
      return { success: false, issues: res.issues };
    }
    const { value, fields, customIssues } = res;
    if (value.username === 'user') {
      customIssues.add(fields.get('username'), { kind: 'UsernameAlreadyUsed' });
    }
    if (customIssues.hasIssues()) {
      return { success: false, issues: customIssues.getIssues() };
    }
    return { success: true, value };
  });

  const submitting = status.status === 'pending';

  const { fields, Form, refObject } = useFormi({
    fields: fieldsDef,
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
      <p>This example shows how you can do additional validation on the server and how to display server errors in your UI.</p>
      <TextInput label="Username (try 'user')" field={fields.get('username')} type="text" />
      <TextInput label="Email" field={fields.get('email')} type="email" defaultValue="demo@example.com" />
      <TextInput label="Password" field={fields.get('password')} type="password" />
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

type AsyncStatus<Res> = { status: 'idle' } | { status: 'pending' } | { status: 'resolved'; data: Res };

function useAsync<Param, Res>(fn: (params: Param) => Promise<Res>): { status: AsyncStatus<Res>; run: (param: Param) => void } {
  const [status, setStatus] = useState<AsyncStatus<Res>>({ status: 'idle' });

  const run = useCallback(
    (param: Param) => {
      setStatus({ status: 'pending' });
      fn(param).then((data) => setStatus({ status: 'resolved', data }));
    },
    [fn]
  );

  return { status, run };
}
