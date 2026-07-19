import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { ProposalProvider } from '../context/ProposalContext';
import { BiometricProvider } from '../context/BiometricContext';
import NotificationRegistrar from '../components/NotificationRegistrar';
import OfflineBanner from '../components/OfflineBanner';
import { initMonitoring } from '../lib/monitoring';
import { checkAndApplyAppUpdate } from '../lib/appUpdates';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    initMonitoring();
    void checkAndApplyAppUpdate();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProposalProvider>
          <BiometricProvider>
            <OfflineBanner />
            <NotificationRegistrar />
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="p" options={{ animation: 'fade' }} />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </BiometricProvider>
          </ProposalProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
