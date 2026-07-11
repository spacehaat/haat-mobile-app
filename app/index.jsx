import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/ui/LoadingScreen';
import { defaultTabPathForUser } from '../lib/access';

export default function Index() {
  const { booting, isAuthenticated, user } = useAuth();

  if (booting) return <LoadingScreen label="Starting Spacehaat…" />;
  if (isAuthenticated) return <Redirect href={defaultTabPathForUser(user)} />;
  return <Redirect href="/(auth)/login" />;
}
