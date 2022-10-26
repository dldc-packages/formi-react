import { useState } from 'react';
import { FormiFieldOf } from './FormiField';
import { FormiDefAny } from './FormiDef';
import { FormiFieldsStore } from './FormiFieldsStore';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

/**
 * Create a FormController then subscribe to form state
 */
export function useFormiFields<Def extends FormiDefAny>(formName: string, fieldsDef: Def): FormiFieldOf<Def> {
  const [fieldsStore] = useState(() => FormiFieldsStore(formName, fieldsDef));

  const fields = useSyncExternalStore(fieldsStore.subscribe, () => fieldsStore.getState());
  return fields as any;
}
