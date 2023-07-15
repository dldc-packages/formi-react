import { useId } from 'react';
import type { IFormiField, TFormiIssue } from '../../src/mod';
import { useFieldState } from '../../src/mod';
import { IssueBox } from '../utils/IssueBox';
import type { UsernameIssue } from './ServerExample';

type Props = {
  label: string;
  field: IFormiField<string, TFormiIssue | UsernameIssue>;
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
      {state.touchedIssues && (
        <IssueBox
          issues={state.touchedIssues}
          renderIssue={(issue, i) => {
            if (issue.kind === 'UsernameAlreadyUsed') {
              return (
                <p className="error" key={i}>
                  Username is already used
                </p>
              );
            }
            return null;
          }}
        />
      )}
    </div>
  );
}
