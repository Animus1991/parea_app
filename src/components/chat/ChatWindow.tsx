import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Minus,
  X,
  MoreVertical,
  Info,
  Phone,
  Video,
  Search,
  Pin,
  Images,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { useStore } from '../../store';
import { useChatPermission } from '../../lib/chatPermissions';
import type { ChatMessage, ChatReplyRef, Conversation } from '../../types/chat';
import { GroupChatStatusStrip } from './GroupChatStatusStrip';
import { QuickReplies } from './QuickReplies';
import { ReportConversationModal } from './ReportConversationModal';
import { ChatMessageBubble } from './ChatMessageBubble';
import { ChatComposerTools } from './ChatComposerTools';
import { ChatStoriesStrip } from './ChatStoriesStrip';
import { ChatCallModal } from './ChatCallModal';
import { cn } from '../../lib/utils';
import { CHAT_TYPO } from '../../lib/typographyTokens';
import { useSwipeDownDismiss } from '../../hooks/useSwipeDownDismiss';
import {
  conversationShowsEventVenue,
  meetingPointMeetAt,
} from '../../lib/meetingPoint';

function typeBadge(c: Conversation, t: (el: string, en: string) => string) {
  if (c.type === 'organizer_announcement') return t('Ανάγνωση μόνο', 'Read only');
  if (c.status === 'persistent') return t('Μόνιμο', 'Persistent');
  return null;
}

function titlesOverlap(a: string, b: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[·:,|/—–-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const left = norm(a);
  const right = norm(b);
  return left === right || left.includes(right) || right.includes(left);
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
  const drafts = useChatStore((s) => s.drafts);
  const setDraft = useChatStore((s) => s.setDraft);
  const sendRichMessage = useChatStore((s) => s.sendRichMessage);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const restoreMessage = useChatStore((s) => s.restoreMessage);
  const togglePinMessage = useChatStore((s) => s.togglePinMessage);
  const votePoll = useChatStore((s) => s.votePoll);
  const closeConversation = useChatStore((s) => s.closeConversation);
  const minimizeConversation = useChatStore((s) => s.minimizeConversation);
  const muteConversation = useChatStore((s) => s.muteConversation);
  const perm = useChatPermission(conversation);

  const [text, setText] = useState(() => drafts[conversation.id] ?? '');
  const [replyTo, setReplyTo] = useState<ChatReplyRef | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showStories, setShowStories] = useState(false);
  const [callMode, setCallMode] = useState<'video' | 'audio' | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dismissRef = useRef<HTMLElement>(null);
  useSwipeDownDismiss(dismissRef, panelRef, () => closeConversation(conversation.id));

  const event = conversation.eventId ? events.find((e) => e.id === conversation.eventId) : undefined;
  const participants = useMemo(
    () =>
      conversation.participantUserIds
        .filter((id) => id !== viewer?.id)
        .map((id) => {
          const u = users.find((x) => x.id === id);
          return { id, name: u?.name ?? id };
        }),
    [conversation.participantUserIds, users, viewer?.id],
  );

  useEffect(() => {
    setText(drafts[conversation.id] ?? '');
    setReplyTo(null);
    setTagFilter(null);
  }, [conversation.id]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when switching window

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleTextChange = (next: string) => {
    setText(next);
    setDraft(conversation.id, next);
  };

  const nameFor = (id: string) => {
    if (id === 'system') return t('Σύστημα', 'System');
    const u = users.find((x) => x.id === id);
    return u?.name?.split(' ')[0] ?? id;
  };

  const visibleMessages = useMemo(() => {
    let list = messages;
    if (tagFilter) {
      list = list.filter(
        (m) =>
          m.tags?.includes(tagFilter) ||
          m.body.toLowerCase().includes(`#${tagFilter}`),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((m) => m.body.toLowerCase().includes(q));
    }
    if (conversation.meetingPoint) {
      list = list.filter((m) => m.type !== 'meeting_point');
    }
    return list;
  }, [messages, tagFilter, searchQuery, conversation.meetingPoint]);

  const pinnedMsg = useMemo(
    () => [...messages].reverse().find((m) => m.pinned && m.type !== 'meeting_point'),
    [messages],
  );

  const eventVenue = conversationShowsEventVenue(conversation.type)
    ? event?.exactLocation || event?.locationArea
    : undefined;

  const meetAt = useMemo(() => {
    const announcement = [...messages].reverse().find((m) => m.type === 'meeting_point');
    return meetingPointMeetAt(announcement?.body) || (eventVenue ? event?.time : undefined);
  }, [messages, eventVenue, event?.time]);

  const jumpToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-brand', 'rounded-2xl');
      window.setTimeout(() => el.classList.remove('ring-2', 'ring-brand', 'rounded-2xl'), 1400);
    }
  };

  const badge = typeBadge(conversation, t);

  return (
    <>
      <div
        ref={panelRef}
        className={cn(
          'fixed z-modal md:z-sheet flex flex-col overflow-hidden shadow-soft-lg copilot-shift',
          'bg-surface border-border text-ink',
          'chat-popup-window inset-0 md:left-auto md:top-auto md:w-[360px] md:rounded-3xl md:border',
          stackIndex === 0 && 'md:right-6',
          stackIndex === 1 && 'md:right-[24rem]',
        )}
        data-chat-window
      >
        <div className="relative flex flex-col h-full min-h-0">
          {/* Header — swipe down also closes the group chat preview */}
          <header
            ref={dismissRef}
            data-chat-window-dismiss=""
            className="flex items-center gap-1.5 px-3 py-2 border-b border-border bg-surface-raised shrink-0 touch-none md:touch-auto"
          >
            <div className="min-w-0 flex-1">
              <p className={cn(CHAT_TYPO.title, 'truncate')}>{conversation.title}</p>
              {event?.title && !titlesOverlap(conversation.title, event.title) && (
                <p className={cn(CHAT_TYPO.subtitle, 'truncate')}>{event.title}</p>
              )}
              {badge && <p className={CHAT_TYPO.badge}>{badge}</p>}
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label={t('Αναζήτηση μηνυμάτων', 'Search messages')}
              title={t('Αναζήτηση', 'Search')}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                searchOpen ? 'bg-brand-soft text-brand' : 'text-ink-muted hover:bg-ink/10 hover:text-ink',
              )}
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-full text-ink-muted hover:bg-ink/10"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={t('Ενέργειες', 'Actions')}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => minimizeConversation(conversation.id)}
              className="p-1.5 rounded-full text-ink-muted hover:bg-ink/10 hidden md:block"
              aria-label={t('Ελαχιστοποίηση', 'Minimize')}
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => closeConversation(conversation.id)}
              className="p-1.5 rounded-full text-ink-muted hover:bg-ink/10"
              aria-label={t('Κλείσιμο', 'Close')}
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          {menuOpen && (
            <>
              <button
                type="button"
                className="absolute inset-0 z-20 cursor-default"
                aria-label={t('Κλείσιμο μενού', 'Close menu')}
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className={cn(
                  'absolute right-3 top-11 z-30 rounded-2xl border border-border bg-surface-raised py-1 shadow-soft-lg min-w-[180px]',
                  CHAT_TYPO.menu,
                )}
              >
                {perm.canSend && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 text-left px-3.5 py-2 hover:bg-ink/5"
                      onClick={() => {
                        setCallMode('audio');
                        setMenuOpen(false);
                      }}
                    >
                      <Phone className="w-3.5 h-3.5" aria-hidden />
                      {t('Φωνητική κλήση', 'Voice call')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 text-left px-3.5 py-2 hover:bg-ink/5"
                      onClick={() => {
                        setCallMode('video');
                        setMenuOpen(false);
                      }}
                    >
                      <Video className="w-3.5 h-3.5" aria-hidden />
                      {t('Βιντεοκλήση', 'Video call')}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 text-left px-3.5 py-2 hover:bg-ink/5"
                  onClick={() => {
                    setShowStories((s) => !s);
                    setMenuOpen(false);
                  }}
                >
                  <Images className="w-3.5 h-3.5" aria-hidden />
                  {t('Πολυμέσα και stories', 'Media and stories')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 text-left px-3.5 py-2 hover:bg-ink/5"
                  onClick={() => {
                    const nextMuted = !conversation.muted;
                    muteConversation(conversation.id, nextMuted);
                    setMenuOpen(false);
                    toast.success(
                      nextMuted
                        ? t('Η συνομιλία σε σίγαση', 'Conversation muted')
                        : t('Η σίγαση απενεργοποιήθηκε', 'Unmuted'),
                    );
                  }}
                >
                  {conversation.muted ? t('Ξεσίγαση', 'Unmute') : t('Σίγαση', 'Mute')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 text-left px-3.5 py-2 hover:bg-ink/5 text-red-600"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                >
                  {t('Αναφορά', 'Report')}
                </button>
              </div>
            </>
          )}

          {showStories && <ChatStoriesStrip conversationId={conversation.id} compact />}

          {/* Search & Tag Filter Bar */}
          {(searchOpen || tagFilter) && (
            <div className="px-3 py-1.5 border-b border-border bg-surface-raised flex items-center gap-2 shrink-0">
              {searchOpen && (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('Αναζήτηση στη συνομιλία…', 'Search in chat…')}
                  className="flex-1 h-7 rounded-full border border-border bg-surface px-3 text-xs text-ink focus:outline-none"
                />
              )}
              {tagFilter && (
                <button
                  type="button"
                  onClick={() => setTagFilter(null)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-soft text-brand text-2xs font-bold"
                >
                  #{tagFilter} <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}

          {pinnedMsg && (
            <button
              type="button"
              onClick={() => jumpToMessage(pinnedMsg.id)}
              className="px-3 py-1.5 border-b border-border bg-amber-50/70 dark:bg-amber-950/25 flex items-center gap-2 text-left text-2xs text-ink hover:bg-amber-100/60 dark:hover:bg-amber-950/40 shrink-0"
            >
              <Pin className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="font-bold shrink-0">{t('Καρφιτσωμένο:', 'Pinned:')}</span>
              <span className="truncate text-ink-muted">{pinnedMsg.body}</span>
            </button>
          )}

          <GroupChatStatusStrip
            conversationId={conversation.id}
            isEphemeral={conversation.isEphemeral && conversation.status === 'active'}
            venue={eventVenue}
            meetingPoint={conversation.meetingPoint}
            meetAt={meetAt}
            locked={conversation.status === 'locked'}
            canAnnounce={perm.canSend}
          />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 flex flex-col gap-2.5 min-h-0">
            <div className="mt-auto" aria-hidden />
            {!perm.canRead && perm.reasonIfLocked && (
              <div className={cn('rounded-2xl border border-amber-500/30 bg-amber-500/15 p-3', CHAT_TYPO.lockNotice)}>
                {t(perm.reasonIfLocked.el, perm.reasonIfLocked.en)}
              </div>
            )}

            {perm.canRead &&
              visibleMessages.map((m: ChatMessage) => (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  senderName={nameFor(m.senderId)}
                  mine={m.senderId === viewer?.id}
                  viewerId={viewer?.id}
                  compact
                  selected={selectedMessageId === m.id}
                  onSelect={() => setSelectedMessageId((cur) => (cur === m.id ? null : m.id))}
                  onJumpTo={jumpToMessage}
                  onTagClick={(tag) => setTagFilter((cur) => (cur === tag ? null : tag))}
                  onReply={(msg) =>
                    setReplyTo({
                      id: msg.id,
                      senderId: msg.senderId,
                      senderName: nameFor(msg.senderId),
                      body: msg.body || (msg.media ? `[${msg.media.kind}]` : ''),
                      type: msg.type,
                    })
                  }
                  onReact={(messageId, emoji) =>
                    viewer && toggleReaction(messageId, emoji, viewer.id)
                  }
                  onEdit={(messageId, body) =>
                    viewer && editMessage(messageId, body, viewer.id)
                  }
                  onDelete={(messageId) => {
                    if (!viewer) return;
                    const snap = deleteMessage(messageId, viewer.id);
                    if (snap) {
                      toast.info(t('Το μήνυμα διαγράφηκε', 'Message deleted'), {
                        action: {
                          label: t('Αναίρεση', 'Undo'),
                          onClick: () => restoreMessage(snap),
                        },
                      });
                    }
                  }}
                  onPin={(messageId) => togglePinMessage(conversation.id, messageId)}
                  onVotePoll={(messageId, optId) =>
                    viewer && votePoll(messageId, optId, viewer.id)
                  }
                />
              ))}
            <div ref={bottomRef} />
          </div>

          <div className="shrink-0 min-h-0 max-h-[55%] overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
          <QuickReplies
            onSelect={(q) => {
              if (!viewer || !perm.canSend) return;
              sendRichMessage({
                conversationId: conversation.id,
                senderId: viewer.id,
                body: q,
                replyTo: replyTo ?? undefined,
              });
              setReplyTo(null);
            }}
            disabled={!perm.canSend}
          />

          {perm.canSend ? (
            <ChatComposerTools
              compact
              value={text}
              onChange={handleTextChange}
              participants={participants}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onSendText={(body, meta) => {
                if (!viewer) return;
                sendRichMessage({
                  conversationId: conversation.id,
                  senderId: viewer.id,
                  body,
                  replyTo: replyTo ?? undefined,
                  tags: meta.tags,
                  mentions: meta.mentions,
                });
                setText('');
                setReplyTo(null);
              }}
              onSendMedia={(media, caption) => {
                if (!viewer) return;
                sendRichMessage({
                  conversationId: conversation.id,
                  senderId: viewer.id,
                  body: caption ?? media.label ?? '',
                  type: media.kind,
                  media,
                  replyTo: replyTo ?? undefined,
                });
                setReplyTo(null);
              }}
              onSendPoll={(poll) => {
                if (!viewer) return;
                sendRichMessage({
                  conversationId: conversation.id,
                  senderId: viewer.id,
                  body: poll.question,
                  type: 'poll',
                  poll,
                });
              }}
            />
          ) : (
            <div className={cn('p-3 border-t border-border shrink-0 flex items-center gap-2', CHAT_TYPO.footer)}>
              <Info className="w-3.5 h-3.5 shrink-0" />
              {perm.reasonIfLocked
                ? t(perm.reasonIfLocked.el, perm.reasonIfLocked.en)
                : t('Η συνομιλία είναι κλειδωμένη', 'Conversation is locked')}
            </div>
          )}
          </div>
        </div>
      </div>

      <ReportConversationModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        conversationId={conversation.id}
      />

      <ChatCallModal
        open={callMode !== null}
        mode={callMode ?? 'video'}
        title={conversation.title}
        participants={participants}
        onClose={() => setCallMode(null)}
        onEnded={(durationSec, mode) => {
          if (!viewer) return;
          const label =
            mode === 'video'
              ? t(`Βιντεοκλήση · ${durationSec}δ`, `Video call · ${durationSec}s`)
              : t(`Φωνητική κλήση · ${durationSec}δ`, `Voice call · ${durationSec}s`);
          useChatStore.getState().receiveMessage(conversation.id, label, 'system', 'system');
        }}
      />
    </>
  );
}
