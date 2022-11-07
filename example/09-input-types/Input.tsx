import React, { useId } from 'react';
import { FormiField, FormiIssue, useFieldState } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField<string | number | boolean, FormiIssue>;
  type?: 'password' | 'text' | 'email' | 'number' | 'checkbox';
  defaultValue?: string;
};

export function Input({ label, field, type = 'text', defaultValue }: Props) {
  const state = useFieldState(field);
  const id = useId();

  if (type === 'checkbox') {
    return (
      <div className="input">
        <label htmlFor={id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input id={id} type={type} name={state.name} defaultValue={defaultValue} />
          {label}
        </label>
        <IssueBox issues={state.touchedIssues} />
      </div>
    );
  }

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} name={state.name} defaultValue={defaultValue} />
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
