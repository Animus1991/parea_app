import { useState, useRef, useEffect, useMemo } from 'react';
import { Minus, X, MoreVertical, Info } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { useChatPermission } from '../../lib/chatPermissions';
import type { Conversation } from '../../types/chat';
import { EphemeralChatBanner } from './EphemeralChatBanner';
import { MeetingPointPanel } from './MeetingPointPanel';
import { QuickReplies } from './QuickReplies';
import { ReportConversationModal } from './ReportConversationModal';
import { cn } from '../../lib/utils';

function typeBadge(c: Conversation, t: (el: string, en: string) => string) {
  if (c.type === 'organizer_announcement') return t('Ανάγνωση μόνο', 'Read only');
  if (c.isEphemeral) return t('Προσωρινό', 'Temporary');
  if (c.status === 'persistent') return t('Μόνιμο', 'Persistent');
  return null;
}

export function ChatWindow({
  conversation,
  stackIndex,
}: {
  conversation: Conversation;
  stackIndex: number;
}) {
  const { t } = useLanguage();
  const viewer = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const allMessages = useChatStore((s) => s.messages);
  const messages = useMemo(
    () => allMessages.filter((m) => m.conversationId === conversation.id),
    [allMessages, conversation.id],
  );
  const sendMessage = useChatStore((s) => s.sendMessage);
  const closeConversation = useChatStore((s) => s.closeConversation);
  const minimizeConversation = useChatStore((s) => s.minimizeConversation);
  const muteConversation = useChatStore((s) => s.muteConversation);
  const perm = useChatPermission(conversation);
  const [text, setText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const event = conversation.eventId ? events.find((e) => e.id === conversation.eventId) : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const badge = typeBadge(conversation, t);

  return (
    <>
      <div
        className={cn(
          'fixed z-[65] flex flex-col overflow-hidden shadow-2xl',
          'bg-[#0c1016] border-white/10 text-white',
          'inset-0 md:inset-auto md:bottom-6 md:h-[420px] md:w-[320px] md:rounded-2xl md:border',
          stackIndex === 0 && 'md:right-6',
          stackIndex === 1 && 'md:right-[22rem]',
        )}
        data-chat-window
      >
        <ChatWindowInner
          conversation={conversation}
          eventTitle={event?.title}
          messages={messages}
          perm={perm}
          text={text}
          setText={setText}
          badge={badge}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onSend={() => {
            if (!text.trim() || !viewer || !perm.canSend) return;
            sendMessage(conversation.id, text.trim(), viewer.id);
            setText('');
          }}
          onQuick={(q) => {
            if (!viewer || !perm.canSend) return;
            sendMessage(conversation.id, q, viewer.id);
          }}
          onClose={() => closeConversation(conversation.id)}
          onMinimize={() => minimizeConversation(conversation.id)}
          onReport={() => setReportOpen(true)}
          onMute={() => muteConversation(conversation.id, !conversation.muted)}
          users={users}
          viewerId={viewer?.id}
          bottomRef={bottomRef}
          t={t}
        />
      </div>
      <ReportConversationModal open={reportOpen} onClose={() => setReportOpen(false)} conversationId={conversation.id} />
    </>
  );
}

function ChatWindowInner({
  conversation,
  eventTitle,
  messages,
  perm,
  text,
  setText,
  badge,
  menuOpen,
  setMenuOpen,
  onSend,
  onQuick,
  onClose,
  onMinimize,
  onReport,
  onMute,
  users,
  viewerId,
  bottomRef,
  t,
}: {
  conversation: Conversation;
  eventTitle?: string;
  messages: ReturnType<typeof useChatStore.getState>['messages'];
  perm: ReturnType<typeof useChatPermission>;
  text: string;
  setText: (v: string) => void;
  badge: string | null;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  onSend: () => void;
  onQuick: (q: string) => void;
  onClose: () => void;
  onMinimize: () => void;
  onReport: () => void;
  onMute: () => void;
  users: { id: string; name: string }[];
  viewerId?: string;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  t: (el: string, en: string) => string;
}) {
  const nameFor = (id: string) => {
    if (id === 'system') return t('Σύστημα', 'System');
    const u = users.find((x) => x.id === id);
    return u?.name?.split(' ')[0] ?? id;
  };

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <header className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 shrink-0">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold truncate">{conversation.title}</p>
          {eventTitle && <p className="text-[10px] text-gray-500 truncate">{eventTitle}</p>}
          {badge && <p className="text-[9px] text-cyan-400 font-bold">{badge}</p>}
        </div>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-white/10" aria-label={t('Ενέργειες', 'Actions')}>
          <MoreVertical className="w-4 h-4" />
        </button>
        <button type="button" onClick={onMinimize} className="p-1.5 rounded-lg hover:bg-white/10 hidden md:block" aria-label={t('Ελαχιστοποίηση', 'Minimize')}>
          <Minus className="w-4 h-4" />
        </button>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" aria-label={t('Κλείσιμο', 'Close')}>
          <X className="w-4 h-4" />
        </button>
      </header>
      {menuOpen && (
        <div className="absolute right-3 top-12 z-10 rounded-xl border border-white/10 bg-[#1a2030] py-1 text-[11px] shadow-xl">
          <button type="button" className="block w-full text-left px-4 py-2 hover:bg-white/5" onClick={onMute}>
            {conversation.muted ? t('Ξεσίγαση', 'Unmute') : t('Σίγαση', 'Mute')}
          </button>
          <button type="button" className="block w-full text-left px-4 py-2 hover:bg-white/5" onClick={onReport}>
            {t('Αναφορά', 'Report')}
          </button>
        </div>
      )}
      {conversation.isEphemeral && conversation.status === 'active' && (
        <EphemeralChatBanner conversationId={conversation.id} />
      )}
      {(conversation.type === 'event_group' || conversation.meetingPoint) && (
        <MeetingPointPanel
          conversationId={conversation.id}
          venue={conversation.meetingPoint}
          meetingPoint={conversation.meetingPoint}
          locked={conversation.status === 'locked'}
        />
      )}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {!perm.canRead && perm.reasonIfLocked && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3 text-[11px] text-amber-100">
            {t(perm.reasonIfLocked.el, perm.reasonIfLocked.en)}
          </div>
        )}
        {perm.canRead &&
          messages.map((m) => {
            const mine = m.senderId === viewerId;
            const isSystem = m.senderType === 'system';
            return (
              <div
                key={m.id}
                className={cn('flex flex-col max-w-[90%]', mine ? 'ml-auto items-end' : 'items-start', isSystem && 'mx-auto items-center max-w-full')}
              >
                {!isSystem && !mine && (
                  <span className="text-[9px] text-gray-500 mb-0.5">{nameFor(m.senderId)}</span>
                )}
                <div
                  className={cn(
                    'rounded-2xl px-3 py-2 text-[12px] leading-relaxed break-words',
                    isSystem && 'bg-white/5 text-gray-400 text-[10px] text-center',
                    mine && 'bg-cyan-600 text-white',
                    !mine && !isSystem && 'bg-white/10 text-gray-100',
                  )}
                >
                  {m.body}
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>
      <QuickReplies onSelect={onQuick} disabled={!perm.canSend} />
      {perm.canSend ? (
        <form
          className="flex gap-2 p-3 border-t border-white/10 shrink-0 pb-safe"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('Μήνυμα…', 'Message…')}
            className="flex-1 min-h-10 rounded-xl bg-white/5 border border-white/10 px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            aria-label={t('Σύνθεση μηνύματος', 'Compose message')}
          />
          <button type="submit" className="min-h-10 px-4 rounded-xl bg-cyan-600 font-bold text-[12px]">
            {t('Αποστολή', 'Send')}
          </button>
        </form>
      ) : (
        <div className="p-3 border-t border-white/10 text-[10px] text-gray-500 shrink-0 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 shrink-0" />
          {perm.reasonIfLocked ? t(perm.reasonIfLocked.el, perm.reasonIfLocked.en) : t('Η συνομιλία είναι κλειδωμένη', 'Conversation is locked')}
        </div>
      )}
    </div>
  );
}
