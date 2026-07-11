import { useLocalSearchParams } from 'expo-router';
import PublicProposalPortal from '../../components/portal/PublicProposalPortal';

export default function PublicPortalScreen() {
  const { token } = useLocalSearchParams();
  const shareToken = Array.isArray(token) ? token[0] : token;
  return <PublicProposalPortal token={shareToken} />;
}
