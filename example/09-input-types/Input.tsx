import React from 'react';
import { FormiField_Value, useFieldState, FormiIssue } from '../../src';
import { IssueBox } from './IssueBox';

type Props = {
  label: string;
  field: FormiField_Value<string | number | boolean, FormiIssue>;
  type?: 'password' | 'text' | 'email' | 'number' | 'checkbox';
  defaultValue?: string;
};

export function Input({ label, field, type = 'text', defaultValue }: Props) {
  const state = useFieldState(field);

  if (type === 'checkbox') {
    return (
      <div className="input">
        <label htmlFor={field.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input id={field.id} type={type} name={field.name} defaultValue={defaultValue} />
          {label}
        </label>
        <IssueBox issues={state.touchedIssues} />
      </div>
    );
  }

  return (
    <div className="input">
      <label htmlFor={field.id}>{label}</label>
      <input id={field.id} type={type} name={field.name} defaultValue={defaultValue} />
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
