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

/** A team member added an expense → admins land on it. */
function openExpenseFromNotification(response) {
  const data = response?.notification?.request?.content?.data || {};
  if (data.type !== 'expense_created' || !data.expenseId) return false;
  router.navigate('/(tabs)/expenses');
  router.push(`/(tabs)/expenses/${String(data.expenseId)}`);
  return true;
}

export default function NotificationRegistrar() {
  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      if (openExpenseFromNotification(response)) return;
      const leadId = leadIdFromNotificationResponse(response);
      if (leadId) openLeadFromNotification(leadId);
    });
    return () => sub.remove();
  }, []);

  return null;
}
