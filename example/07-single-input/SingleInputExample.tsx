import React from 'react';
import { z } from 'zod';
import { FormiDef, useFormi } from '../../src';
import { IssueBox } from './IssueBox';

const FORM_NAME = 'single-input';

const fieldsDef = FormiDef.zodString(z.string().min(1));

export function SingleInputExample() {
  const { fields, Form, useFieldState } = useFormi({
    fields: fieldsDef,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      alert(`Searching ${value}`);
    },
  });

  const inputState = useFieldState(fields);

  return (
    <Form>
      <h2>Single input</h2>
      <p>This example uses a single input.</p>
      <div className="buttons">
        <input type="text" name={fields.name} style={{ flex: 1 }} placeholder="Search" />
        <button type="submit">Submit</button>
      </div>
      <IssueBox issues={inputState.touchedIssues} />
    </Form>
  );
}
