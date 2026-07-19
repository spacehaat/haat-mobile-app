import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function BrowserLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        headerShadowVisible: false,
        contentStyle: { flex: 1, backgroundColor: colors.surface2 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Inventory' }} />
      <Stack.Screen
        name="new"
        options={{
          title: 'Add inventory',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen name="[id]" options={{ title: 'Listing' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit listing' }} />
      <Stack.Screen name="freshness" options={{ title: 'Freshness' }} />
    </Stack>
  );
}
