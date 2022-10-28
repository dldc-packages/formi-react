import React from 'react';
import { z } from 'zod';
import { FormiDef, FormiFieldOf } from '../../src';
import { TextInput } from './TextInput';

export const ingredientFieldDef = FormiDef.object({
  name: FormiDef.zodString(z.string().min(1)),
  quantity: FormiDef.zodString(z.string().min(1)),
});

interface Props {
  field: FormiFieldOf<typeof ingredientFieldDef>;
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
