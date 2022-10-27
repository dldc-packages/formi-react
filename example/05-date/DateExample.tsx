import React from 'react';
import { useFormi, FormiDef, FormiIssue, FormiDefValidateResult } from '../../src';
import { dateFieldDef, DateInput } from './DateInput';
import { IssueBox } from './IssueBox';

export type DateExampleIssue = FormiIssue | { kind: 'StartDateAfterEndDate' };

const fieldsDef = FormiDef.object({
  startDate: dateFieldDef,
  endDate: dateFieldDef,
}).validate((data): FormiDefValidateResult<NonNullable<typeof data>, DateExampleIssue> => {
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
    fields: fieldsDef,
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
      <DateInput label="Start Date" field={fields.get('startDate')} />
      <DateInput label="End Date" field={fields.get('endDate')} />
      <IssueBox issues={rootFieldState.touchedIssues} />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
