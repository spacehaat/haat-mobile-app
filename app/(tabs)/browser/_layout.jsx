import { Stack } from 'expo-router';

export default function BrowserLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Inventory' }} />
      <Stack.Screen name="[id]" options={{ title: 'Listing' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit listing' }} />
      <Stack.Screen name="freshness" options={{ title: 'Freshness' }} />
    </Stack>
  );
}
