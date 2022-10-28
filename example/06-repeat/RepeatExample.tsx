import React from 'react';
import { z } from 'zod';
import { FormiDef, useFormi } from '../../src';
import { ingredientFieldDef, IngredientInput } from './IngredientInput';
import { TextInput } from './TextInput';

const FORM_NAME = 'repeat';

const fieldsDef = FormiDef.object({
  name: FormiDef.zodString(z.string().min(1)),
  ingredients: FormiDef.repeat(ingredientFieldDef, 1),
});

export function RepeatExample() {
  const { fields, Form } = useFormi({
    fields: fieldsDef,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      alert(JSON.stringify(value, null, 2));
    },
  });

  return (
    <Form>
      <h2>Date</h2>
      <p>This example uses a dynamic form with a repeatable field.</p>
      <TextInput field={fields.children.name} label="Recipe name" type="text" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: '2rem' }}>
        {fields.children.ingredients.children.map((ingredientField, index) => {
          return (
            <IngredientInput
              field={ingredientField}
              key={ingredientField.key.id}
              onRemove={() => {
                fields.children.ingredients.actions.remove(index);
              }}
            />
          );
        })}
        <div>
          <button
            onClick={() => {
              fields.children.ingredients.actions.push();
            }}
            type="button"
          >
            Add ingredient
          </button>
        </div>
      </div>
      <div className="buttons">
        <button type="submit">Submit</button>
        <button type="reset">Reset</button>
      </div>
    </Form>
  );
}
