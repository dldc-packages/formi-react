import React from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src';
import { IssueBox } from './IssueBox';

const FORM_NAME = 'single-input';

const initialFields = FormiField.string().zodValidate(z.string().min(1)).use();

export function SingleInputExample() {
  const { fields, Form, useFieldState } = useFormi({
    initialFields,
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
        <input type="text" name={inputState.name} style={{ flex: 1 }} placeholder="Search" />
        <button type="submit">Submit</button>
      </div>
      <IssueBox issues={inputState.touchedIssues} />
    </Form>
  );
}
