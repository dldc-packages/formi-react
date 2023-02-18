import React, { useId } from 'react';
import { FormiField, FormiIssue, useFieldState } from '../../src';
import { IssueBox } from '../utils/IssueBox';

type Props = {
  label: string;
  field: FormiField<any, FormiIssue>;
};

export function FileInput({ label, field }: Props) {
  const state = useFieldState(field);
  const id = useId();

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="file" name={state.name} />
      {state.touchedIssues && <IssueBox issues={state.touchedIssues} />}
    </div>
  );
}
