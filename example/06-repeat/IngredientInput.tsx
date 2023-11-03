import { FormiField } from '@dldc/formi';
import { z } from 'zod';
import { TextInput } from './TextInput';

export const ingredientField = FormiField.group({
  name: FormiField.string().zodValidate(z.string().min(1)),
  quantity: FormiField.string().zodValidate(z.string().min(1)),
});

interface Props {
  field: typeof ingredientField;
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
