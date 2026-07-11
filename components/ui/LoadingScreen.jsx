import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../constants/theme';

export default function LoadingScreen({ label = 'Loading…' }) {
  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color={colors.brand} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    gap: 12,
  },
  label: {
    color: colors.muted,
    fontSize: 14,
  },
});
