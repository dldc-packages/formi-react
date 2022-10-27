import React from 'react';
import { FormiField_Value, useFieldState, FormiIssue } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField_Value<string, FormiIssue>;
  type: 'password' | 'text' | 'email';
  defaultValue?: string;
};

export function TextInput({ label, field, type, defaultValue }: Props) {
  const state = useFieldState(field);

  return (
    <div className="input">
      <label htmlFor={field.id}>{label}</label>
      <input id={field.id} type={type} name={field.name} defaultValue={defaultValue} />
      {state.value && state.value !== state.rawValue && <p>Transformed value: {state.value}</p>}
      {state.touchedIssues && <IssueBox issue={state.touchedIssues[0]} />}
    </div>
  );
}
