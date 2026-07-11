import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { mobileApi } from './api';

const QUEUE_KEY = 'spacehaat.offlineQueue';

async function readQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function getOfflineQueueLength() {
  const q = await readQueue();
  return q.length;
}

export async function enqueueOfflineAction(action) {
  const queue = await readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...action,
  });
  await writeQueue(queue);
  return queue.length;
}

async function processAction(action) {
  if (action.type === 'UPDATE_LEAD_STAGE') {
    return mobileApi.updateLead(action.leadId, { stage: action.stage });
  }
  if (action.type === 'ADD_LEAD_NOTE') {
    return mobileApi.addLeadNote(action.leadId, action.text);
  }
  throw new Error(`Unknown offline action: ${action.type}`);
}

export async function flushOfflineQueue() {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return { flushed: 0, remaining: (await readQueue()).length };

  let queue = await readQueue();
  if (!queue.length) return { flushed: 0, remaining: 0 };

  const failed = [];
  let flushed = 0;

  for (const action of queue) {
    try {
      await processAction(action);
      flushed += 1;
    } catch {
      failed.push(action);
    }
  }

  await writeQueue(failed);
  return { flushed, remaining: failed.length };
}

export async function runOfflineAction(action) {
  const state = await NetInfo.fetch();
  if (state.isConnected) {
    return processAction(action);
  }
  await enqueueOfflineAction(action);
  return { queued: true };
}

export function subscribeOfflineFlush(onFlushed) {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushOfflineQueue().then(onFlushed).catch(() => {});
    }
  });
}
