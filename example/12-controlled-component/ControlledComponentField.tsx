import { FormiField, type TFormiField, type TFormiIssue } from '@dldc/formi';
import { useCallback, useRef } from 'react';
import { useFieldState } from '../../src/useFieldState';
import { IssueBox } from '../utils/IssueBox';
import { ControlledComponent } from './ControlledComponent';

export function dateField() {
  return FormiField.string().validate((value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { success: false, issue: { kind: 'InvalidDate' } };
    }
    return { success: true, value: date };
  });
}

interface ControlledComponentFieldProps {
  field: TFormiField<Date, TFormiIssue | { kind: 'InvalidDate' }>;
  label: string;
  initialDate?: Date;
}

export function ControlledComponentField({ field, label, initialDate }: ControlledComponentFieldProps) {
  const state = useFieldState(field);
  const inputRef = useRef<HTMLInputElement>(null);

  const onValueChange = useCallback((date: Date) => {
    if (inputRef.current) {
      inputRef.current.value = date.toISOString();
      inputRef.current.dispatchEvent(new CustomEvent('input', { bubbles: true, cancelable: true }));
      inputRef.current.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: true }));
    }
  }, []);

  return (
    <div className="input">
      <input
        type="text"
        style={{ display: 'none' }}
        name={state.name}
        ref={inputRef}
        defaultValue={initialDate ? initialDate.toISOString() : undefined}
      />
      <label>{label}</label>
      <ControlledComponent value={state.value ?? null} onChange={onValueChange} />
      <IssueBox issues={state.touchedIssues} />
    </div>
  );
}
