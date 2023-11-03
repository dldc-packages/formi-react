import type { TFormiIssueBase, TValidateResult } from '@dldc/formi';
import { FormiField } from '@dldc/formi';
import { z } from 'zod';
import { useFieldState } from '../../src/mod';
import { IssueBox } from '../utils/IssueBox';

export type DateFieldIssue = TFormiIssueBase | { kind: 'TheWorldEndsIn2048' };

export const dateField = () =>
  FormiField.group({
    year: FormiField.number().zodValidate(z.number().int().min(1900, 'Min year is 1900').max(2100, 'Max year is 2100')),
    month: FormiField.number().zodValidate(z.number().int().min(1, 'Invalid month').max(12, 'Invalid month')),
    day: FormiField.number().zodValidate(z.number().int().min(1, 'Invalid day').max(31, 'Invalid day')),
  }).validate((data): TValidateResult<Date, DateFieldIssue> => {
    if (data === null) {
      return { success: false };
    }
    const date = new Date(data.year, data.month - 1, data.day);
    // Offset to get correct time with timezone
    if (date.getFullYear() >= 2048) {
      return { success: false, issue: { kind: 'TheWorldEndsIn2048' } };
    }
    return { success: true, value: date };
  });

type Props = {
  label: string;
  field: ReturnType<typeof dateField>;
};

export function DateInput({ label, field }: Props) {
  const state = useFieldState(field);

  const yearState = useFieldState(field.children.year);
  const monthState = useFieldState(field.children.month);
  const dayState = useFieldState(field.children.day);

  return (
    <div className="input">
      <label>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
        <div>
          <input type="text" name={yearState.name} placeholder="year" />
          <IssueBox issues={yearState.touchedIssues} />
        </div>
        <div>
          <input type="text" name={monthState.name} placeholder="month" />
          <IssueBox issues={monthState.touchedIssues} />
        </div>
        <div>
          <input type="text" name={dayState.name} placeholder="day" />
          <IssueBox issues={dayState.touchedIssues} />
        </div>
      </div>
      <IssueBox
        issues={state.touchedIssues}
        renderIssue={(issue, i) => {
          if (issue.kind === 'TheWorldEndsIn2048') {
            return (
              <p key={i} className="error">
                Sorry but the world ends in 2048 because God stored the year on 11 bits...
              </p>
            );
          }
          return null;
        }}
      />
      {state.value && <p>Value: {state.value.toLocaleString()}</p>}
    </div>
  );
}
