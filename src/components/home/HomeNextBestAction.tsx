import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { getNextBestActions } from '../../lib/behavioralOptimizer';
import { trackEvent } from '../../lib/analytics';
import { useStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { usePlannedEvents } from '../../hooks/usePlannedEvents';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export function HomeNextBestAction() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();
  const user = useStore((s) => s.currentUser);
  const onboardingCompleted = useStore((s) => s.onboardingCompleted);
  const notifications = useStore((s) => s.notifications);
  const savedEvents = useStore((s) => s.savedEvents);
  const conversations = useChatStore((s) => s.conversations);
  const { plannedEvents } = usePlannedEvents();

  const unreadChats = useMemo(
    () => conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0),
    [conversations],
  );

  const action = useMemo(() => {
    const list = getNextBestActions({
      user,
      onboardingCompleted,
      unreadNotifications: notifications.filter((n) => !n.read).length,
      unreadChats,
      upcomingPlansCount: plannedEvents.length,
      savedEventsCount: savedEvents.length,
      profileInterestsCount: user?.interests?.length ?? 0,
      hasBio: Boolean(user?.bio?.trim()),
    });
    return list[0] ?? null;
  }, [user, onboardingCompleted, notifications, unreadChats, plannedEvents.length, savedEvents.length]);

  if (!action || !user) return null;

  return (
    <button
      type="button"
      onClick={() => {
        trackEvent({ name: 'next_best_action_click', actionId: action.id });
        navigate(action.path);
      }}
      className={cn(
        'w-full text-left rounded-2xl border p-4 transition-all hover:shadow-soft-md',
        a.cardSurface,
        a.borderB,
        a.cardHover,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', a.statBg)}>
          <Sparkles className={cn('w-5 h-5', a.iconAccent)} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-bold uppercase tracking-wider mb-0.5', a.muted)}>
            {t('Επόμενη καλύτερη ενέργεια', 'Next best action')}
          </p>
          <p className={cn('text-sm font-bold', a.head)}>
            {language === 'el' ? action.titleEl : action.titleEn}
          </p>
          <p className={cn('text-xs mt-1', a.sub)}>
            {language === 'el' ? action.descriptionEl : action.descriptionEn}
          </p>
        </div>
        <ArrowRight className={cn('w-4 h-4 shrink-0 mt-1', a.muted)} aria-hidden />
      </div>
    </button>
  );
}
