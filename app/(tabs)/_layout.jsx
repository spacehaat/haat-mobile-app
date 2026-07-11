import { Tabs, Redirect } from 'expo-router';
import { Alert, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/ui/LoadingScreen';
import {
  canSeeBrowserTab,
  canSeeDashboardTab,
  canSeeLeadsTab,
  canSeeMatchTab,
  canSeeProposalsTab,
  canSeeUsersTab,
} from '../../lib/access';
import { colors } from '../../constants/theme';

export default function TabsLayout() {
  const { booting, isAuthenticated, signOut, user } = useAuth();

  if (booting) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  const showDashboard = canSeeDashboardTab(user);
  const showBrowser = canSeeBrowserTab(user);
  const showLeads = canSeeLeadsTab(user);
  const showMatch = canSeeMatchTab(user);
  const showProposals = canSeeProposalsTab(user);
  const showUsers = canSeeUsersTab(user);

  const confirmSignOut = () => {
    Alert.alert(
      'Log out',
      'Are you sure that you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: signOut },
      ],
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        headerRight: () => (
          <Pressable onPress={confirmSignOut} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          href: showDashboard ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Inventory',
          headerShown: false,
          href: showBrowser ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="business-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          headerShown: false,
          href: showLeads ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Smart Match',
          headerShown: true,
          href: showMatch ? undefined : null,
          tabBarLabel: 'Match',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="proposals"
        options={{
          title: 'Proposals',
          headerShown: false,
          href: showProposals ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Team',
          headerShown: false,
          href: showUsers ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
  },
  logoutBtn: { marginRight: 14, paddingVertical: 6, paddingHorizontal: 4 },
  logoutText: { color: colors.brand, fontWeight: '600', fontSize: 14 },
});
