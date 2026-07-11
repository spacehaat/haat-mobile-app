import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { colors } from '../constants/theme';

export default function OfflineBanner() {
  const { pending, sync } = useOfflineSync();

  if (!pending) return null;

  return (
    <Pressable style={styles.banner} onPress={sync}>
      <Text style={styles.text}>
        {pending} change{pending === 1 ? '' : 's'} waiting to sync — tap to retry
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff6e8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0d9a8',
  },
  text: { fontSize: 12, fontWeight: '600', color: '#a86408', textAlign: 'center' },
});
