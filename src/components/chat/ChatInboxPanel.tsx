import { useMemo } from 'react';
import { X, Users, User, Megaphone, LifeBuoy, GitMerge, Lock } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { canOpenConversation } from '../../lib/chatPermissions';
import type { Conversation, ConversationType } from '../../types/chat';
import { cn } from '../../lib/utils';

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
    { key: 'connections', title: t('Συνδέσεις', 'Connections') },
    { key: 'organizer', title: t('Διοργανωτής', 'Organizer') },
    { key: 'support', title: t('Υποστήριξη', 'Support') },
  ] as const;

  return (
    <div
      className={cn(
        'fixed z-[70] flex flex-col border shadow-2xl overflow-hidden',
        'bg-[#0c1016] border-white/10 text-white',
        'inset-x-0 bottom-0 top-auto max-h-[85vh] rounded-t-2xl',
        'md:inset-auto md:bottom-20 md:right-6 md:w-[360px] md:max-h-[min(520px,70vh)] md:rounded-2xl',
      )}
      role="dialog"
      aria-label={t('Nakamas Chat', 'Nakamas Chat')}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div>
          <h2 className="text-sm font-bold">{t('Nakamas Chat', 'Nakamas Chat')}</h2>
          <p className="text-xs text-gray-500">
            {t('Μόνο μετά από αποδοχή αιτήματος ή ομάδας', 'Only after request or group acceptance')}
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-white/10" aria-label={t('Κλείσιμο', 'Close')}>
          <X className="w-5 h-5" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {sections.map((sec) => {
          const items = conversations.filter((c) => sectionFor(c) === sec.key);
          if (!items.length) return null;
          return (
            <section key={sec.key}>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-500/80 px-2 mb-1.5">{sec.title}</p>
              <ul className="space-y-1">
                {items.map((c) => {
                  const Icon = TYPE_ICON[c.type];
                  const perm = canOpenConversation(viewer, c, { groups, companyJoinRequests });
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openConversation(c.id)}
                        className="w-full text-left rounded-xl px-3 py-2.5 hover:bg-white/5 flex gap-3 items-start"
                      >
                        <Icon className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate">{c.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {t(c.lastMessagePreview.el, c.lastMessagePreview.en)}
                          </p>
                          {!perm.canSend && perm.reasonIfLocked && (
                            <p className="text-xs text-amber-400/90 mt-0.5">
                              {t(perm.reasonIfLocked.el, perm.reasonIfLocked.en)}
                            </p>
                          )}
                        </div>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 min-w-[20px] h-5 rounded-full bg-cyan-600 text-xs font-bold flex items-center justify-center px-1">
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
      <footer className="px-4 py-2 border-t border-white/10 text-xs text-gray-500 text-center shrink-0">
        {t('Προσωρινά event chats · σχεδιασμένα με privacy controls', 'Temporary event chats · designed with privacy controls')}
      </footer>
    </div>
  );
}
