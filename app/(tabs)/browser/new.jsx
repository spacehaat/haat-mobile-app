import { Redirect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { canManageInventory, defaultTabPathForUser } from '../../../lib/access';
import NewListingScreen from '../../../components/inventory/NewListingScreen';

export default function NewListingRoute() {
  const { user } = useAuth();
  if (!canManageInventory(user)) {
    return <Redirect href={defaultTabPathForUser(user)} />;
  }
  return <NewListingScreen />;
}
