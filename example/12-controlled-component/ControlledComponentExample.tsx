import { useFormi } from '../../src/mod';
import { ControlledComponentField, dateField } from './ControlledComponentField';

const simpleFields = {
  date1: dateField(),
  date2: dateField(),
};

export function ControlledComponentExample() {
  const { fields, Form } = useFormi({
    formName: 'controller-component',
    initialFields: simpleFields,
    onSubmit: ({ value }, actions) => {
      alert(JSON.stringify(value, null, 2));
      actions.preventDefault();
      actions.reset();
    },
  });

  return (
    <Form>
      <h2>Controlled Component</h2>
      <p>This is an example of how to use a controlled component (like a date picker) as field.</p>
      <p>The idea is to sync the value of an input with the controlled component to bind it to Formi.</p>
      <ControlledComponentField field={fields.date1} label="Date 1" />
      <ControlledComponentField field={fields.date2} label="Date 2" initialDate={new Date(2023, 0, 6)} />
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
