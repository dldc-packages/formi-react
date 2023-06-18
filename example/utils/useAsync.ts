import { useCallback, useState } from 'react';

export type AsyncStatus<Res> = { status: 'idle' } | { status: 'pending' } | { status: 'resolved'; data: Res };

export function useAsync<Param, Res>(
  fn: (params: Param) => Promise<Res>
): { status: AsyncStatus<Res>; run: (param: Param) => void } {
  const [status, setStatus] = useState<AsyncStatus<Res>>({ status: 'idle' });

  const run = useCallback(
    (param: Param) => {
      setStatus({ status: 'pending' });
      fn(param).then((data) => setStatus({ status: 'resolved', data }));
    },
    [fn]
  );

  return { status, run };
}
