import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { canSeeScreen, defaultTabPathForUser } from '../lib/access';

/**
 * Route guard — redirects when the signed-in user lacks access to a screen/section.
 */
export default function RequireScreen({ screen, children, fallback }) {
  const { user } = useAuth();
  if (!canSeeScreen(user, screen)) {
    return <Redirect href={fallback || defaultTabPathForUser(user)} />;
  }
  return children;
}
