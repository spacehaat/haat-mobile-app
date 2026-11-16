import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { canManageInventory, defaultTabPathForUser } from '../../../lib/access';
import SpaceEditor from '../../../components/space-editor/SpaceEditor';

/** Back-compat route — prefer /(tabs)/browser/add. Rendered inline to avoid Android route rematch loops. */
export default function NewSpaceAlias() {
  const { user } = useAuth();
  const { vertical } = useLocalSearchParams();
  if (!canManageInventory(user)) return <Redirect href={defaultTabPathForUser(user)} />;
  return <SpaceEditor vertical={Array.isArray(vertical) ? vertical[0] : vertical} />;
}
