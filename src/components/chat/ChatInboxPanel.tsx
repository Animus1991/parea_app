import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Users, User, Megaphone, LifeBuoy, GitMerge, Lock, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { EmptyState } from '../common/EmptyState';
import { ChatStoriesStrip } from './ChatStoriesStrip';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { canOpenConversation } from '../../lib/chatPermissions';
import type { Conversation, ConversationType } from '../../types/chat';
import { cn } from '../../lib/utils';
import { CHAT_TYPO } from '../../lib/typographyTokens';
import { useSwipeDownDismiss } from '../../hooks/useSwipeDownDismiss';

const TYPE_ICON: Record<ConversationType, typeof Users> = {
  event_group: Users,
  direct: User,
  person_to_group: Lock,
  group_to_person: User,
  group_to_group: GitMerge,
  organizer_announcement: Megaphone,
  support: LifeBuoy,
};

function sectionFor(c: Conversation): 'active' | 'pending' | 'groups' | 'connections' | 'organizer' | 'support' {
  if (c.type === 'support') return 'support';
  if (c.type === 'organizer_announcement') return 'organizer';
  if (c.status === 'pending' || c.status === 'locked') return 'pending';
  if (c.type === 'direct' && c.status === 'persistent') return 'connections';
  if (c.type === 'event_group' || c.type === 'group_to_group') return 'groups';
  return 'active';
}

export function ChatInboxPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLDivElement>(null);
  useSwipeDownDismiss(dismissRef, panelRef, onClose);
  const allConversations = useChatStore((s) => s.conversations);
  const conversations = useMemo(
    () => allConversations.filter((c) => c.status !== 'archived'),
    [allConversations],
  );
  const openConversation = useChatStore((s) => s.openConversation);
  const viewer = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const companyJoinRequests = useStore((s) => s.companyJoinRequests);

  const sections = [
    { key: 'active', title: t('Ενεργά σχέδια', 'Active plans') },
    { key: 'pending', title: t('Αιτήματα', 'Pending requests') },
    { key: 'groups', title: t('Ομάδες', 'Groups') },
    { key: 'connections', title: t('Nakamas', 'Nakamas') },
    { key: 'organizer', title: t('Διοργανωτής', 'Organizer') },
    { key: 'support', title: t('Υποστήριξη', 'Support') },
  ] as const;

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed z-sheet flex flex-col border shadow-soft-lg overflow-hidden copilot-shift',
        'bg-surface border-border text-ink',
        'inset-x-0 rounded-t-3xl',
        'top-[calc(var(--header-h)+2.5rem)]',
        'bottom-[calc(var(--bottom-nav-total)+6px+var(--chat-hat-fab)+8px+env(safe-area-inset-bottom,0px))]',
        'md:inset-auto md:top-auto md:bottom-[calc(1.5rem+var(--chat-hat-fab)+0.75rem)] md:right-6 md:w-[360px] md:max-h-[min(520px,70vh)] md:rounded-3xl',
      )}
      role="dialog"
      aria-label={t('Nakamas Chat', 'Nakamas Chat')}
    >
      <div ref={dismissRef} data-chat-inbox-dismiss="" className="shrink-0 touch-none">
        <div
          className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-border-strong"
          aria-hidden
        />
        <header className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-border">
          <div>
            <h2 className="text-sm md:text-base font-bold">{t('Nakamas Chat', 'Nakamas Chat')}</h2>
            <p className="sr-only">{t('Σύρε κάτω για κλείσιμο', 'Swipe down to close')}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-ink/10" aria-label={t('Κλείσιμο', 'Close')}>
            <X className="w-5 h-5" />
          </button>
        </header>
      </div>
      <ChatStoriesStrip compact />
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {conversations.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            character="crew"
            title={t('Καμία συνομιλία ακόμα', 'No conversations yet')}
            description={t('Οι συνομιλίες ξεκλειδώνουν μετά από αποδοχή αιτήματος ή ομάδας.', 'Conversations unlock after a request or group is accepted.')}
            className="m-2 border-0 bg-transparent"
            actionLabel={t('Περιήγηση εκδηλώσεων', 'Browse Events')}
            onAction={() => {
              onClose();
              navigate('/');
            }}
            secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
            onSecondary={() => {
              onClose();
              navigate('/buddy-seek');
            }}
          />
        )}
        {sections.map((sec) => {
          const items = conversations.filter((c) => sectionFor(c) === sec.key);
          if (!items.length) return null;
          return (
            <section key={sec.key}>
              <p className="text-xs font-bold tracking-wider text-brand/80 px-2 mb-1.5">{sec.title}</p>
              <ul className="space-y-1">
                {items.map((c) => {
                  const Icon = TYPE_ICON[c.type];
                  const perm = canOpenConversation(viewer, c, { groups, companyJoinRequests });
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openConversation(c.id)}
                        className="w-full text-left rounded-2xl px-3 py-2.5 hover:bg-ink/5 flex gap-3 items-start"
                      >
                        <Icon className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{c.title}</p>
                          <p className="text-xs text-ink-muted truncate">
                            {t(c.lastMessagePreview.el, c.lastMessagePreview.en)}
                          </p>
                          {!perm.canSend && perm.reasonIfLocked && (
                            <p className={cn('text-xs mt-0.5', CHAT_TYPO.lockHint)}>
                              {t(perm.reasonIfLocked.el, perm.reasonIfLocked.en)}
                            </p>
                          )}
                        </div>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-brand text-brand-fg text-xs font-bold flex items-center justify-center px-1">
                            {c.unreadCount}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
