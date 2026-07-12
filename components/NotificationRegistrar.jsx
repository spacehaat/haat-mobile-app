import { useEffect } from 'react';
import { router } from 'expo-router';
import { addNotificationResponseListener } from '../lib/notifications';

export default function NotificationRegistrar() {
  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data || {};
      const leadId = data.leadId;
      if (leadId && (data.type === 'lead_assigned' || data.type === 'lead_created' || data.type === 'follow_up_overdue')) {
        router.push(`/(tabs)/leads/${leadId}`);
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}
