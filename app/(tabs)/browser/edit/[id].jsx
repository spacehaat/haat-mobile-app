import { Redirect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../context/AuthContext';
import { canManageInventory, defaultTabPathForUser } from '../../../../lib/access';
import SpaceEditor from '../../../../components/space-editor/SpaceEditor';

export default function EditSpaceRoute() {
  const { id } = useLocalSearchParams();
  const spaceId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  if (!canManageInventory(user)) return <Redirect href={defaultTabPathForUser(user)} />;
  if (!spaceId || spaceId === 'new') return <SpaceEditor />;
  return <SpaceEditor spaceId={spaceId} />;
}
