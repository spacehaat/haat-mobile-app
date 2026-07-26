import { Stack, useRouter, Redirect } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { canCreateLead, canSeeLeadsTab, defaultTabPathForUser } from '../../../lib/access';
import { colors } from '../../../constants/theme';

function HeaderBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/leads');
      }}
      style={{ marginLeft: 4, padding: 6 }}
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={24} color={colors.ink} />
    </Pressable>
  );
}

export default function LeadsLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const canAdd = canCreateLead(user);

  if (!canSeeLeadsTab(user)) {
    return <Redirect href={defaultTabPathForUser(user)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        headerBackVisible: true,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Leads',
          headerRight: canAdd ? () => (
            <Pressable
              onPress={() => router.push('/(tabs)/leads/new')}
              style={{ marginRight: 12, padding: 4 }}
              hitSlop={8}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.brand} />
            </Pressable>
          ) : undefined,
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New lead',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Lead detail',
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
