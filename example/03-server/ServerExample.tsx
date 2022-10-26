import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { FormiController, FormiIssue, useFormiForm, withIssue } from '../../src';
import { TextInput } from './TextInput';

export type Issue = FormiIssue | { kind: 'UsernameAlreadyUsed' };

const field = withIssue<Issue>();

const fieldsDef = field.object({
  username: field.zodString(z.string().min(1).max(20)),
  email: field.zodString(z.string().email()),
  password: field.zodString(z.string().min(3)),
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

  console.log({ status });

  const submitting = status.status === 'pending';

  const { fields, Form, refObject, controller } = useFormiForm({
    fields: fieldsDef,
    formName: FORM_NAME,
    onSubmit: ({ formData }, actions) => {
      actions.preventDefault();
      run(formData);
    },
    issues: status.status === 'resolved' && status.data.success === false ? status.data.issues : undefined,
  });

  console.log(controller);

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
