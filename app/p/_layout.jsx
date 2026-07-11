import { Stack } from 'expo-router';

export default function PublicPortalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
  );
}
