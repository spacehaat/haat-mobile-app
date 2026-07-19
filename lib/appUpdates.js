import * as Updates from 'expo-updates';

export async function checkAndApplyAppUpdate() {
  if (__DEV__ || !Updates.isEnabled) return false;

  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return false;

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
