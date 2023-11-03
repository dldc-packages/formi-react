import type { IFormiField, TFormiIssue } from '@dldc/formi';
import { useId } from 'react';
import { useFieldState } from '../../src/mod';
import { IssueBox } from '../utils/IssueBox';

type Props = {
  label: string;
  field: IFormiField<string, TFormiIssue>;
  type: 'password' | 'text' | 'email';
  defaultValue?: string;
};

export function TextInput({ label, field, type, defaultValue }: Props) {
  const state = useFieldState(field);
  const id = useId();

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} name={state.name} defaultValue={defaultValue} />
      {state.value && <p>Transformed value: {state.value}</p>}
      {state.touchedIssues && <IssueBox issues={state.touchedIssues} />}
    </div>
  );
}
