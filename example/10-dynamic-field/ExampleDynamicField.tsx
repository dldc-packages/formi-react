import React, { Fragment, useState } from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src/mod';
import { TextInput } from './TextInput';

const simpleFields = {
  username: FormiField.string().zodValidate(z.string().min(1).max(20)),
};

export function ExampleDynamicField() {
  const { fields, Form } = useFormi({
    initialFields: simpleFields,
    formName: 'components',
    onSubmit: ({ value }, actions) => {
      alert(JSON.stringify(value, null, 4));
      actions.preventDefault();
      actions.reset();
    },
  });

  const [showForm, setShowForm] = useState(false);

  return (
    <Form>
      <h2>Dynamic Fields</h2>
      <p>In this example we use dynamically show / hide a fields</p>
      <button onClick={() => setShowForm(!showForm)} type="button">
        Toggle Form
      </button>
      {showForm && (
        <Fragment>
          <TextInput label="Username" field={fields.username} type="text" />
          <div className="buttons">
            <button type="submit">Submit</button>
            <button type="reset">Reset</button>
          </div>
        </Fragment>
      )}
    </Form>
  );
}
