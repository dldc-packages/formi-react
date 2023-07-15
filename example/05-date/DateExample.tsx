import type { TFormiIssue, TValidateResult } from '../../src/mod';
import { FormiField, useFormi } from '../../src/mod';
import { IssueBox } from '../utils/IssueBox';
import { DateInput, dateField } from './DateInput';

export type DateExampleIssue = TFormiIssue | { kind: 'StartDateAfterEndDate' };

const initialFields = FormiField.group({
  startDate: dateField(),
  endDate: dateField(),
}).validate((data): TValidateResult<NonNullable<typeof data>, DateExampleIssue> => {
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
        This example uses a custom <code>DateInput</code> that is composed of three inputs (year, month, day) and also
        expose a custom field def.
      </p>
      <DateInput label="Start Date" field={fields.children.startDate} />
      <DateInput label="End Date" field={fields.children.endDate} />
      <IssueBox
        issues={rootFieldState.touchedIssues}
        renderIssue={(issue, i) => {
          if (issue.kind === 'StartDateAfterEndDate') {
            return (
              <p key={i} className="error">
                Start date must be before end date.
              </p>
            );
          }
          return null;
        }}
      />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
