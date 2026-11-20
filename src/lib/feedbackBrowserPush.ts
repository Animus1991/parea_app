import { pendingFeedbackNotificationId } from './notificationsUtil';

export function feedbackPushCopy(eventTitle: string, language: 'el' | 'en'): { title: string; body: string } {
  return language === 'el'
    ? { title: 'Πώς πέρασες;', body: `«${eventTitle}»` }
    : { title: 'How was it?', body: `"${eventTitle}"` };
}

/** Browser push only when permission is already granted — never prompt. */
export function tryBrowserPushFeedback(
  event: { id: string; title: string },
  language: 'el' | 'en',
): boolean {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  const copy = feedbackPushCopy(event.title, language);
  try {
    new Notification(copy.title, {
      body: copy.body,
      tag: pendingFeedbackNotificationId(event.id),
    });
    return true;
  } catch {
    return false;
  }
}
