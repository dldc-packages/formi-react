import React from 'react';
import { z } from 'zod';
import { FormiField, useFormi } from '../../src';
import { ingredientField, IngredientInput } from './IngredientInput';
import { TextInput } from './TextInput';

const FORM_NAME = 'repeat';

const initialFields = {
  name: FormiField.string().zodValidate(z.string().min(1)),
  ingredients: [ingredientField()],
};

export function RepeatExample() {
  const { fields, Form, setFields } = useFormi({
    initialFields,
    formName: FORM_NAME,
    onSubmit: ({ value }, actions) => {
      actions.preventDefault();
      alert(JSON.stringify(value, null, 4));
    },
  });

  return (
    <Form>
      <h2>Repeat</h2>
      <p>This example uses a dynamic form with a repeatable field.</p>
      <TextInput field={fields.name} label="Recipe name" type="text" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginLeft: '2rem' }}>
        {fields.ingredients.map((ingredientField, index) => {
          return (
            <IngredientInput
              field={ingredientField}
              key={ingredientField.key.id}
              onRemove={() => {
                setFields((prev) => {
                  const ingredients = [...prev.ingredients];
                  ingredients.splice(index, 1);
                  return { ...prev, ingredients };
                });
              }}
            />
          );
        })}
        <div>
          <button
            onClick={() => {
              setFields((prev) => ({ ...prev, ingredients: [...prev.ingredients, ingredientField()] }));
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
