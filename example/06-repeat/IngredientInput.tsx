import React from 'react';
import { z } from 'zod';
import { FormiField, FormiFieldFromBuilder } from '../../src';
import { TextInput } from './TextInput';

export const ingredientField = FormiField.group({
  name: FormiField.string().zodValidate(z.string().min(1)).use(),
  quantity: FormiField.string().zodValidate(z.string().min(1)).use(),
});

interface Props {
  field: FormiFieldFromBuilder<typeof ingredientField>;
  onRemove: () => void;
}

export function IngredientInput({ field, onRemove }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-end' }}>
      <TextInput field={field.children.name} label="Ingredient Name" type="text" />
      <TextInput field={field.children.quantity} label="Ingredient Quantity" type="text" />
      <button type="button" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}
