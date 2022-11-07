import React from 'react';
import { FormiField, FormiIssue, useFormi, ValidateResult } from '../../src';
import { dateField, DateInput } from './DateInput';
import { IssueBox } from './IssueBox';

export type DateExampleIssue = FormiIssue | { kind: 'StartDateAfterEndDate' };

const initialFields = FormiField.group({
  startDate: dateField(),
  endDate: dateField(),
}).validate((data): ValidateResult<NonNullable<typeof data>, DateExampleIssue> => {
  if (data === null) {
    return { success: false };
  }
  if (data.startDate > data.endDate) {
    return { success: false, issue: { kind: 'StartDateAfterEndDate' } };
  }
  return { success: true, value: data };
});

const FORM_NAME = 'date';

export function DateExample() {
  const { fields, Form, useFieldState } = useFormi({
    initialFields: initialFields,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      window.alert(`Start: ${value.startDate.toLocaleDateString()} End: ${value.endDate.toLocaleDateString()}`);
    },
  });

  const rootFieldState = useFieldState(fields);

  return (
    <Form>
      <h2>Date</h2>
      <p>
        This example uses a custom <code>DateInput</code> that is composed of three inputs (year, month, day) and also expose a custom field
        def.
      </p>
      <DateInput label="Start Date" field={fields.children.startDate} />
      <DateInput label="End Date" field={fields.children.endDate} />
      <IssueBox issues={rootFieldState.touchedIssues} />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
