import * as Updates from 'expo-updates';
import { InteractionManager } from 'react-native';

export async function checkAndApplyAppUpdate() {
  if (__DEV__ || !Updates.isEnabled) return false;

  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) {
          resolve(false);
          return;
        }

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        resolve(true);
      } catch {
        resolve(false);
      }
    });
  });
}
