import { useEffect } from 'react';
import { router } from 'expo-router';
import { addNotificationResponseListener } from '../lib/notifications';

const LEAD_NOTIFICATION_TYPES = new Set([
  'lead_assigned',
  'lead_created',
  'follow_up_overdue',
  'lead_reminder',
]);

function leadIdFromNotificationResponse(response) {
  const data = response?.notification?.request?.content?.data || {};
  const leadId = data.leadId;
  if (!leadId || !LEAD_NOTIFICATION_TYPES.has(data.type)) return null;
  return String(leadId);
}

function openLeadFromNotification(leadId) {
  router.navigate('/(tabs)/leads');
  router.push(`/(tabs)/leads/${leadId}`);
}

export default function NotificationRegistrar() {
  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const leadId = leadIdFromNotificationResponse(response);
      if (leadId) openLeadFromNotification(leadId);
    });
    return () => sub.remove();
  }, []);

  return null;
}
