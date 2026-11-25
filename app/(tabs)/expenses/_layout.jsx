import { Stack, useRouter, Redirect } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { canSeeExpensesTab, defaultTabPathForUser, isAdmin } from '../../../lib/access';
import { colors } from '../../../constants/theme';

function HeaderBackButton() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/expenses');
      }}
      style={{ marginLeft: 4, padding: 6 }}
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={24} color={colors.ink} />
    </Pressable>
  );
}

export default function ExpensesLayout() {
  const router = useRouter();
  const { user } = useAuth();

  if (!canSeeExpensesTab(user)) {
    return <Redirect href={defaultTabPathForUser(user)} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: isAdmin(user) ? 'Expenses' : 'My expenses',
          headerRight: isAdmin(user)
            ? () => (
                <Pressable onPress={() => router.push('/(tabs)/expenses/categories')} style={{ marginRight: 12, padding: 4 }} hitSlop={8}>
                  <Ionicons name="pricetags-outline" size={22} color={colors.brand} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <Stack.Screen name="new" options={{ title: 'Add expense', headerLeft: () => <HeaderBackButton /> }} />
      <Stack.Screen name="[id]" options={{ title: 'Expense', headerLeft: () => <HeaderBackButton /> }} />
      <Stack.Screen name="categories" options={{ title: 'Categories', headerLeft: () => <HeaderBackButton /> }} />
    </Stack>
  );
}
