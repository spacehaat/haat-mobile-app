import { Stack } from 'expo-router';

export default function ProposalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Proposals' }} />
      <Stack.Screen name="builder" options={{ title: 'Proposal Builder' }} />
      <Stack.Screen name="[id]" options={{ title: 'Proposal' }} />
    </Stack>
  );
}
