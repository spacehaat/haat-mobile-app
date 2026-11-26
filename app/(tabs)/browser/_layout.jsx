import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/theme';

function HeaderBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/browser');
      }}
      style={{ marginLeft: 4, padding: 6 }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={24} color={colors.ink} />
    </Pressable>
  );
}

export default function BrowserLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        headerShadowVisible: false,
        headerBackVisible: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.surface2 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Inventory', headerLeft: undefined }} />
      <Stack.Screen
        name="add"
        options={{
          title: 'Inventory',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Inventory',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Space details',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: 'Inventory',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="vo/[id]"
        options={{
          title: 'Virtual office',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="vo/proposal"
        options={{
          title: 'Send proposal',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="vo/edit"
        options={{
          title: 'Virtual office',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="freshness"
        options={{
          title: 'Freshness',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
