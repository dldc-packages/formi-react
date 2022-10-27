import React from 'react';
import { z } from 'zod';
import { useFieldState, FormiDef, FormiFieldOf, FormiDefValidateResult, FormiIssueBase } from '../../src';
import { IssueBox } from './IssueBox';

export type DateFieldIssue = FormiIssueBase | { kind: 'TheWorldEndsIn2048' };

export const dateFieldDef = FormiDef.object({
  year: FormiDef.zodNumber(z.number().int().min(1900, 'Min year is 1900').max(2100, 'Max year is 2100')),
  month: FormiDef.zodNumber(z.number().int().min(1, 'Invalid month').max(12, 'Invalid month')),
  day: FormiDef.zodNumber(z.number().int().min(1, 'Invalid day').max(31, 'Invalid day')),
}).validate((data): FormiDefValidateResult<Date, DateFieldIssue> => {
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
  field: FormiFieldOf<typeof dateFieldDef>;
};

export function DateInput({ label, field }: Props) {
  const state = useFieldState(field);

  const { year: yearField, month: monthField, day: dayField } = field.children;

  const yearState = useFieldState(yearField);
  const monthState = useFieldState(monthField);
  const dayState = useFieldState(dayField);

  return (
    <div className="input">
      <label>{label}</label>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
        <input id={yearField.id} type="text" name={yearField.name} placeholder="year" />
        <input id={monthField.id} type="text" name={monthField.name} placeholder="month" />
        <input id={dayField.id} type="text" name={dayField.name} placeholder="day" />
      </div>
      <IssueBox issues={state.touchedIssues} />
      <IssueBox issues={yearState.touchedIssues} />
      <IssueBox issues={monthState.touchedIssues} />
      <IssueBox issues={dayState.touchedIssues} />
    </div>
  );
}
