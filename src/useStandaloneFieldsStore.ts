import { useState } from 'react';
import { FormiFieldOf } from './FormiField';
import { FormiDefAny } from './FormiDef';
import { FormiFieldsStore } from './FormiFieldsStore';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

/**
 * Initialize a standalone fields store (without a controller).
 */
export function useStandaloneFieldsStore<Def extends FormiDefAny>(formName: string, fieldsDef: Def): FormiFieldOf<Def> {
  const [fieldsStore] = useState(() => FormiFieldsStore(formName, fieldsDef));

  const fields = useSyncExternalStore(fieldsStore.subscribe, () => fieldsStore.getState());
  return fields as any;
}
