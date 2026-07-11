import { useEffect, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { flushOfflineQueue, getOfflineQueueLength, subscribeOfflineFlush } from '../lib/offlineQueue';

export function useOfflineSync() {
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    const len = await getOfflineQueueLength();
    setPending(len);
  }, []);

  const sync = useCallback(async () => {
    const result = await flushOfflineQueue();
    await refresh();
    return result;
  }, [refresh]);

  useEffect(() => {
    refresh();
    const unsubNet = subscribeOfflineFlush(() => refresh());
    const subApp = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => {
      unsubNet();
      subApp.remove();
    };
  }, [refresh, sync]);

  return { pending, sync, refresh };
}
