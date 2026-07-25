import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';

/**
 * Safe area wrapper for pageSheet/full-screen modals.
 * RN's built-in SafeAreaView often ignores the status bar inside Modal on Android.
 */
export default function ModalSafeArea({ children, style, edges = ['top', 'bottom'] }) {
  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: colors.surface }, style]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
}
