import React, { useId } from 'react';
import { FormiField, FormiIssue, useFieldState } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField<string, FormiIssue>;
  type?: 'password' | 'text' | 'email';
  defaultValue?: string;
};

export function TextInput({ label, field, type = 'text', defaultValue }: Props) {
  const state = useFieldState(field);
  const id = useId();

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} name={state.name} defaultValue={defaultValue} />
      {state.value && <p>Transformed value: {state.value}</p>}
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
