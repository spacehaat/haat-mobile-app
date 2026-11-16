import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { canManageInventory, defaultTabPathForUser } from '../../../lib/access';
import SpaceEditor from '../../../components/space-editor/SpaceEditor';

export default function AddSpaceRoute() {
  const { user } = useAuth();
  const { vertical } = useLocalSearchParams();
  if (!canManageInventory(user)) return <Redirect href={defaultTabPathForUser(user)} />;
  return <SpaceEditor vertical={Array.isArray(vertical) ? vertical[0] : vertical} />;
}
