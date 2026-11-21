import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useStore } from "../../store";
import {
  Users,
  ArrowLeft,
  Info,
  MapPin,
  Calendar,
  ShieldCheck,
  Tag,
  X,
  Clock,
  Search,
  Navigation,
  Link2,
  Compass,
  UserPlus,
  Check,
  Phone,
  Video,
  Images,
  Siren,
  MoreHorizontal,
} from "lucide-react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";
import { toast } from "sonner";
import { useLanguage } from "../../lib/i18n";
import { useGroupChatContrast } from "../../hooks/useGroupChatContrast";
import { cn } from "../../lib/utils";
import { APP_TYPO } from "../../lib/typographyTokens";
import { PAGE_FILL } from "../layout/PageShell";
import { useGroupChatMessages, type GroupChatMessage } from "../../hooks/useGroupChatMessages";
import { useChatStore } from "../../store/chatStore";
import { toChatMessage } from "../../lib/chatMessageAdapters";
import type { ChatReplyRef } from "../../types/chat";
import { ChatMessageBubble } from "../chat/ChatMessageBubble";
import { ChatComposerTools } from "../chat/ChatComposerTools";
import { ChatStoriesStrip } from "../chat/ChatStoriesStrip";
import { ChatCallModal } from "../chat/ChatCallModal";
import { LiveEventTracker } from "./LiveEventTracker";
import { ChatIcebreakers } from "./ChatIcebreakers";
import { GroupChatStatusStrip } from "../chat/GroupChatStatusStrip";
import { QuickReplies } from "../chat/QuickReplies";
import { GroupChatThreadStarter } from "./GroupChatThreadStarter";
import { localizeSystemBody } from "../../lib/chatSystemCopy";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { AppSelect } from "../common/AppSelect";
import { GroupChatLeaveModal } from "./groupChat/GroupChatLeaveModal";
import { GroupChatReportModal } from "./groupChat/GroupChatReportModal";
import { GroupChatLocationModal } from "./groupChat/GroupChatLocationModal";
import { GroupChatSosModal } from "./groupChat/GroupChatSosModal";
import { canModerateGroup } from "../../lib/roles";
import { eventTagPath } from "../../lib/eventTags";
import { formatPlanWhen } from '../../lib/dateLocale';
import { showNightCoordinationTools, translateEventTag } from '../../lib/eventDisplay';
import { formatLocationArea } from '../../lib/eventDisplay';

/** Room under the newest message so the floating chats button (desktop) never covers it. */
const VIRTUOSO_SPACER = { Footer: () => <div aria-hidden className="h-2 md:h-14" /> };

export default function GroupChatPageContent() {
  const { t, language } = useLanguage();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const events = useStore((state) => state.events);
  const groups = useStore((state) => state.groups);
  const users = useStore((state) => state.users);
  const currentUser = useStore((state) => state.currentUser);
  const leaveGroup = useStore((state) => state.leaveGroup);
  const joinGroup = useStore((state) => state.joinGroup);
  const ensureEventGroupConversation = useChatStore((s) => s.ensureEventGroupConversation);
  const gc = useGroupChatContrast();

  // Ensure we default to an array even if map fails, though mock data shouldn't
  const group =
    groups.find((g) => g.id === groupId) ||
    groups.find((g) => g.eventId === groupId); // Fallback if routing passes eventId
  const event = events.find((e) => e.id === group?.eventId);
  const resolvedGroupId = group?.id;
  const isMember = Boolean(currentUser && group?.members.includes(currentUser.id));
  const onWaitlist = Boolean(currentUser && group?.waitlist?.includes(currentUser.id));

  useEffect(() => {
    if (!group || !event || !isMember) return;
    ensureEventGroupConversation({
      groupId: group.id,
      eventId: event.id,
      title: event.title,
      participantUserIds: group.members,
      meetingPoint: group.meetingPoint,
    });
  }, [group?.id, event?.id, isMember, ensureEventGroupConversation]); // eslint-disable-line react-hooks/exhaustive-deps -- bridge once per group/event

  const buildSeedMessages = (): GroupChatMessage[] => {
    if (!currentUser) return [];
    return [
      {
        id: "system1",
        senderId: "system",
        senderName: t("Σύστημα", "System"),
        text: t(
          "Η ομάδα επιβεβαιώθηκε. Πείτε γεια στα Nakamas σας και συμφωνήστε πού θα συναντηθείτε.",
          "Your group is confirmed. Say hi to your Nakamas and agree where to meet.",
        ),
        timestamp: new Date().toISOString(),
        type: "system",
      },
    ];
  };

  const { messages, setMessages, conversationId } = useGroupChatMessages(
    resolvedGroupId,
    buildSeedMessages,
  );
  const sendRichMessage = useChatStore((s) => s.sendRichMessage);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteStoreMessage = useChatStore((s) => s.deleteMessage);
  const restoreStoreMessage = useChatStore((s) => s.restoreMessage);
  const togglePinMessage = useChatStore((s) => s.togglePinMessage);
  const votePoll = useChatStore((s) => s.votePoll);
  const receiveMessage = useChatStore((s) => s.receiveMessage);

  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<ChatReplyRef | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showStories, setShowStories] = useState(false);
  const [callMode, setCallMode] = useState<'video' | 'audio' | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isEphemeral, setIsEphemeral] = useState(true);
  const [showDisableEphemeralModal, setShowDisableEphemeralModal] =
    useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const sosActive = Boolean(currentUser && group?.membersLocations?.[currentUser.id]?.sos);
  const showHelpAlert = Boolean(
    currentUser &&
      group &&
      event &&
      showNightCoordinationTools({
        inGroup: isMember,
        event,
        alreadyActive: sosActive || isSharingLocation,
      }),
  );
  const [showLocationConfigModal, setShowLocationConfigModal] = useState(false);
  const [showLiveRadarModal, setShowLiveRadarModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSafetyLinkModal, setShowSafetyLinkModal] = useState(false);
  const [locationConfig, setLocationConfig] = useState({
    precision: "approximate",
    shareWith: "all",
    duration: "event_end",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberAddSearchQuery, setMemberAddSearchQuery] = useState("");

  useEffect(() => {
    if (!toolsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setToolsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toolsOpen]);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({
          index: "LAST",
          align: "end",
          behavior: "smooth",
        });
      }
    }, 50);
  };

  const handleDeleteMessage = (id: string) => {
    if (conversationId && currentUser) {
      const snap = deleteStoreMessage(id, currentUser.id);
      if (snap) {
        toast.info(t("Το μήνυμα διαγράφηκε", "Message deleted"), {
          action: {
            label: t("Αναίρεση", "Undo"),
            onClick: () => restoreStoreMessage(snap),
          },
        });
      }
      return;
    }
    setMessages(messages.filter((m) => m.id !== id));
    toast.success(t("Το μήνυμα διαγράφηκε", "Message deleted"));
  };

  const displayMessages = useMemo(
    () =>
      messages.map((m) =>
        m.senderId === "system" || m.type === "system"
          ? {
              ...m,
              senderName: t("Σύστημα", "System"),
              text: localizeSystemBody(m.text, t),
            }
          : m,
      ),
    [messages, t],
  );

  const filteredMessages = useMemo(() => {
    return displayMessages
      .filter((m) => senderFilter === "all" || m.senderId === senderFilter)
      .filter((m) =>
        !tagFilter ||
        m.tags?.includes(tagFilter) ||
        m.text.toLowerCase().includes(`#${tagFilter}`),
      )
      .filter((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [displayMessages, senderFilter, tagFilter, searchQuery]);

  const hasUserMessage = displayMessages.some((m) => m.senderId !== "system");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({
          index: "LAST",
          align: "end",
          behavior: "auto",
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!group || !event) {
    return (
      <div className={cn(PAGE_FILL, "py-6")}>
        <EmptyState
          title={t('Το Chat δεν βρέθηκε', 'Chat not found')}
          description={t(
            'Ίσως διαγράφηκε η ομάδα ή ο σύνδεσμος είναι λάθος.',
            'The group may have been removed, or the link is wrong.',
          )}
          actionLabel={t('Τα σχέδιά μου', 'My plans')}
          onAction={() => navigate('/plans')}
          secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
          onSecondary={() => navigate('/buddy-seek')}
        />
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className={cn(PAGE_FILL, "space-y-4 py-4")}>
        <h1 className={cn(APP_TYPO.pageTitle, "text-ink")}>{t('Chat ομάδας', 'Group chat')}</h1>
        <div className="rounded-2xl border border-border bg-surface-raised p-4">
          <p className="text-sm font-bold text-ink">
            {t('Αυτό το chat είναι μόνο για τα μέλη της ομάδας.', 'This chat is only for group members.')}
          </p>
          {onWaitlist && (
            <p className="mt-2 text-xs font-medium text-ink-muted">
              {t('Είσαι στη λίστα αναμονής — όταν μπεις, ανοίγει και το chat.', 'You are on the waitlist — chat opens once you join.')}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => navigate('/plans')}>
              {t('Τα σχέδιά μου', 'My plans')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/buddy-seek')}>
              {t('Βρες Nakamas', 'Find Nakamas')}
            </Button>
            {event && (
              <Button size="sm" variant="ghost" onClick={() => navigate(`/events/${event.id}`)}>
                {t('Δες την εκδήλωση', 'See the event')}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determine if the current user is an admin of the group
  // Host or event organizer only: being an organizer elsewhere grants nothing here.
  const isGroupAdmin = canModerateGroup(currentUser, group, event);

  const groupMembersDetailed = group.members.map(
    (mId) => users.find((u) => u.id === mId) || currentUser,
  );
  const potentialNewMembers = users.filter(
    (u) => !group.members.includes(u.id) && !u.isOrganizer,
  );

  const renderMessage = (index: number, msg: GroupChatMessage) => {
    const isSystem = msg.senderId === "system" && msg.type !== "location";
    const isLocationMsg = msg.type === "location";
    const isMe = msg.senderId === currentUser.id;

    if (isSystem) {
      return (
        <div
          key={msg.id}
          className="text-center my-6 flex justify-center w-full px-4"
        >
          <span className="text-xs font-medium tracking-tight text-ink bg-[#F3F4F6] dark:bg-white/10 px-4 py-2 rounded-full shadow-soft max-w-sm text-center leading-relaxed">
            {msg.text}
          </span>
        </div>
      );
    }

    if (isLocationMsg) {
      return (
        <div
          key={msg.id}
          className="text-center my-6 flex justify-center w-full px-4 animate-in fade-in duration-300"
        >
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-800/50 px-4 py-2.5 rounded-full shadow-soft max-w-sm">
            <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200 leading-tight">
              {msg.text}
            </span>
          </div>
        </div>
      );
    }

    const activeConvId = conversationId ?? `conv_${group.id}`;
    const chatMsg = toChatMessage(msg, activeConvId);
    return (
      <div key={msg.id} className="px-4 py-1.5">
        <ChatMessageBubble
          message={chatMsg}
          senderName={isMe ? t("Εσείς", "You") : msg.senderName}
          mine={isMe}
          viewerId={currentUser?.id}
          onReply={(target) =>
            setReplyTo({
              id: target.id,
              senderId: target.senderId,
              senderName: target.senderId === currentUser?.id ? t("Εσείς", "You") : msg.senderName,
              body: target.body || (target.media ? `[${target.media.kind}]` : ""),
              type: target.type,
            })
          }
          onJumpTo={(targetId) => {
            const idx = filteredMessages.findIndex((x) => x.id === targetId);
            if (idx >= 0 && virtuosoRef.current) {
              virtuosoRef.current.scrollToIndex({ index: idx, align: "center", behavior: "smooth" });
            }
          }}
          onReact={(msgId, emoji) =>
            currentUser && toggleReaction(msgId, emoji, currentUser.id)
          }
          onEdit={(msgId, body) =>
            currentUser && editMessage(msgId, body, currentUser.id)
          }
          onDelete={(msgId) => handleDeleteMessage(msgId)}
          onPin={(msgId) => togglePinMessage(activeConvId, msgId)}
          onVotePoll={(msgId, optId) =>
            currentUser && votePoll(msgId, optId, currentUser.id)
          }
          onTagClick={(tag) => setTagFilter((cur) => (cur === tag ? null : tag))}
        />
      </div>
    );
  };

  return (
    <div className={cn(PAGE_FILL, "h-full flex-1 min-h-[calc(100dvh-var(--header-h))] md:min-h-[420px]")}>
      <div className="w-full h-full min-h-0 md:min-h-[420px] flex bg-white dark:bg-surface-raised border-0 md:border border-gray-100 dark:border-border rounded-none md:rounded-2xl shadow-none md:shadow-soft overflow-hidden relative">
        <div
          className={`flex flex-col flex-1 h-full min-w-0 ${showInfo ? "hidden md:flex border-r border-gray-200 dark:border-border" : "flex"}`}
        >
          {/* Header: title row + tools row so the event name stays readable on a phone. */}
          <div className="flex flex-col shrink-0 border-b border-gray-200 dark:border-border bg-white dark:bg-surface-raised relative z-20">
            {showSearchMobile ? (
              <div className="flex items-center gap-2 w-full px-3 py-2.5 animate-in fade-in slide-in-from-right-4 duration-200">
                <button
                  onClick={() => {
                    setShowSearchMobile(false);
                    setSearchQuery("");
                  }}
                  className="p-2 text-gray-400 hover:text-ink"
                  aria-label={t('Κλείσιμο αναζήτησης', 'Close search')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <input
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- focus moves only after the user opened this field
                  autoFocus
                  type="text"
                  placeholder={t("Αναζήτηση συνομιλίας...", "Search chat...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-border-strong rounded-lg focus:outline-none focus:ring-2 focus:ring-ink bg-gray-50 dark:bg-white/5"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    aria-label={t('Εκκαθάριση αναζήτησης', 'Clear search')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-3 md:px-5 py-2.5">
                  <button
                    onClick={() => navigate(-1)}
                    className="text-gray-400 hover:text-ink transition-colors p-1 min-h-8 min-w-8 flex items-center justify-center rounded-full shrink-0"
                    aria-label={t('Πίσω', 'Go back')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h1 className={cn(APP_TYPO.pageTitle, "text-ink truncate")}>
                      {event.title}
                    </h1>
                    <p className="text-xs text-gray-500 tracking-wide font-medium truncate flex items-center gap-1.5 mt-0.5">
                      <Users className="h-3 w-3 shrink-0" aria-hidden />
                      <span>
                        {group.members.length} {t("μέλη", "members")}
                      </span>
                      <span aria-hidden>·</span>
                      <Calendar className="h-3 w-3 shrink-0" aria-hidden />
                      <span>
                        {formatPlanWhen(event.date, event.time, language)}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={cn("transition-colors p-2 rounded-full min-h-8 min-w-8 shrink-0", showInfo ? gc.infoActive : "text-gray-400 hover:text-ink hover:bg-gray-100 dark:hover:bg-white/10")}
                    aria-label={showInfo ? t('Απόκρυψη πληροφοριών', 'Hide info panel') : t('Εμφάνιση πληροφοριών', 'Show info panel')}
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-0.5 px-2 pb-2 overflow-x-auto noscrollbar">
                  <div className="hidden md:flex items-center gap-3 mr-2 shrink-0">
                    <AppSelect
                      ariaLabel={t("Φίλτρο αποστολέα", "Sender filter")}
                      value={senderFilter}
                      onValueChange={setSenderFilter}
                      className={cn("filter-select border border-gray-200 dark:border-border bg-gray-50 dark:bg-white/5 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer transition-colors max-w-[120px]", gc.focusRing)}
                      options={[
                        { value: "all", label: t("Όλοι οι αποστολείς", "All Senders") },
                        ...groupMembersDetailed.map((m) => ({ value: m.id, label: m.name })),
                      ]}
                    />
                    <div className="relative group">
                      <Search className={cn("h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors", gc.focusIcon)} />
                      <input
                        type="text"
                        placeholder={t("Αναζήτηση...", "Search...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn("pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-border rounded-lg focus:outline-none focus:ring-1 w-32 xl:w-48 bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-surface-raised transition-all", gc.focusRing)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setShowSearchMobile(true)}
                    className="text-gray-400 hover:text-ink hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors p-2 shrink-0"
                    aria-label={t('Αναζήτηση', 'Search')}
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={toolsOpen}
                      aria-label={t('Περισσότερες επιλογές', 'More options')}
                      onClick={() => setToolsOpen((open) => !open)}
                      className="p-2 rounded-full text-gray-400 hover:text-ink hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <MoreHorizontal className="h-5 w-5" aria-hidden />
                    </button>
                    {toolsOpen && (
                      <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-48 rounded-xl border border-border bg-surface-raised p-1 shadow-soft-lg">
                        <button role="menuitem" type="button" onClick={() => { setCallMode('audio'); setToolsOpen(false); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-ink hover:bg-surface">
                          <Phone className="h-4 w-4" aria-hidden /> {t('Φωνητική κλήση', 'Voice call')}
                        </button>
                        <button role="menuitem" type="button" onClick={() => { setCallMode('video'); setToolsOpen(false); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-ink hover:bg-surface">
                          <Video className="h-4 w-4" aria-hidden /> {t('Βιντεοκλήση', 'Video call')}
                        </button>
                        <button role="menuitem" type="button" onClick={() => { setShowStories((s) => !s); setToolsOpen(false); }} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-ink hover:bg-surface">
                          <Images className="h-4 w-4" aria-hidden /> {t('Πολυμέσα και stories', 'Media and stories')}
                        </button>
                        {event && (
                          <div role="none" className="px-2 py-1">
                            <ChatIcebreakers
                              eventTitle={event.title}
                              interests={currentUser?.interests ?? []}
                              menuItem
                              onSuggest={(text) => { setNewMessage(text); setToolsOpen(false); }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {showStories && (
            <ChatStoriesStrip conversationId={conversationId ?? `conv_${group.id}`} compact />
          )}

          {tagFilter && (
            <div className="px-4 py-1.5 border-b border-border bg-surface flex items-center gap-2 text-xs shrink-0">
              <span className="text-ink-muted">{t('Φίλτρο tag:', 'Tag filter:')}</span>
              <button
                type="button"
                onClick={() => setTagFilter(null)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-soft text-brand font-bold"
              >
                #{tagFilter} <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <GroupChatStatusStrip
            conversationId={conversationId ?? `conv_${group.id}`}
            isEphemeral={isEphemeral}
            venue={event.exactLocation || event.locationArea}
            meetingPoint={group.meetingPoint}
            locked={group.status !== "confirmed" && group.status !== "completed"}
          />

          {/* Messages Virtualized */}
          <div className="flex-1 min-h-0 bg-[#F9FAFB] dark:bg-surface relative shadow-inner flex flex-col">
            {isSharingLocation && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
                <button
                  onClick={() => setShowLocationConfigModal(true)}
                  className="bg-white/90 dark:bg-surface-raised/90 backdrop-blur-sm border border-emerald-200 text-emerald-700 dark:border-emerald-800/60 dark:text-emerald-300 shadow-soft px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t("Κοινοποίηση τοποθεσίας", "Sharing Location")}
                </button>
              </div>
            )}
            <Virtuoso
              ref={virtuosoRef}
              data={filteredMessages}
              itemContent={renderMessage}
              className="h-full w-full min-h-0 custom-scrollbar flex-1"
              alignToBottom={true}
              components={VIRTUOSO_SPACER}
            />
            {!hasUserMessage && (
              <GroupChatThreadStarter
                eventTitle={event.title}
                whenLabel={formatPlanWhen(event.date, event.time, language)}
                whereLabel={event.exactLocation || event.locationArea}
                onPick={setNewMessage}
              />
            )}
          </div>

          {/* Safety bar + Rich SOTA Composer */}
          <div className="border-t border-gray-200 dark:border-border bg-white dark:bg-surface-raised shrink-0 relative z-20 pb-[env(safe-area-inset-bottom,0px)]">
            <div className="flex items-center gap-2 px-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLocationConfigModal(true)}
                className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 border ${
                  isSharingLocation
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 ring-2 ring-emerald-500/20"
                    : "bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-border hover:bg-gray-100 dark:hover:bg-white/10"
                }`}
                title={t("Χάρτης ομάδας", "Group map")}
                aria-label={t("Χάρτης ομάδας", "Group map")}
              >
                <Compass
                  className={`h-4 w-4 ${isSharingLocation ? "animate-pulse" : ""}`}
                  aria-hidden
                />
              </button>
              {showHelpAlert && (
              <button
                type="button"
                onClick={() => setShowSosConfirm(true)}
                className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 border ${
                  group.membersLocations?.[currentUser.id]?.sos
                    ? "bg-red-600 text-white border-red-700 ring-2 ring-red-500 animate-pulse"
                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                }`}
                title={t("Χρειάζομαι βοήθεια", "I need help")}
                aria-label={t("Χρειάζομαι βοήθεια", "I need help")}
              >
                <Siren className="h-4 w-4" aria-hidden />
              </button>
              )}
            </div>
            <QuickReplies
              onSelect={(q) => {
                if (!currentUser) return;
                const convId = conversationId ?? `conv_${group.id}`;
                sendRichMessage({
                  conversationId: convId,
                  senderId: currentUser.id,
                  body: q,
                  replyTo: replyTo ?? undefined,
                });
                setReplyTo(null);
                scrollToBottom();
              }}
            />
            <ChatComposerTools
              value={newMessage}
              onChange={setNewMessage}
              participants={groupMembersDetailed.filter((u) => u.id !== currentUser?.id).map((u) => ({ id: u.id, name: u.name }))}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onSendText={(body, meta) => {
                if (!currentUser) return;
                const convId = conversationId ?? `conv_${group.id}`;
                sendRichMessage({
                  conversationId: convId,
                  senderId: currentUser.id,
                  body,
                  replyTo: replyTo ?? undefined,
                  tags: meta.tags,
                  mentions: meta.mentions,
                });
                setNewMessage("");
                setReplyTo(null);
                scrollToBottom();
              }}
              onSendMedia={(media, caption) => {
                if (!currentUser) return;
                const convId = conversationId ?? `conv_${group.id}`;
                sendRichMessage({
                  conversationId: convId,
                  senderId: currentUser.id,
                  body: caption ?? media.label ?? "",
                  type: media.kind,
                  media,
                  replyTo: replyTo ?? undefined,
                });
                setReplyTo(null);
                scrollToBottom();
              }}
              onSendPoll={(poll) => {
                if (!currentUser) return;
                const convId = conversationId ?? `conv_${group.id}`;
                sendRichMessage({
                  conversationId: convId,
                  senderId: currentUser.id,
                  body: poll.question,
                  type: "poll",
                  poll,
                });
                scrollToBottom();
              }}
            />
          </div>
        </div>

        {showInfo && (
          <div className="w-full md:w-[320px] lg:w-[380px] bg-white dark:bg-surface-raised shrink-0 flex flex-col absolute md:relative z-30 h-full border-l border-gray-200 dark:border-border animate-in slide-in-from-right-8 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-border bg-white dark:bg-surface-raised sticky top-0 z-10 shadow-soft">
              <h3 className="font-bold text-ink text-sm tracking-wide">
                {t("Λεπτομέρειες ομάδας", "Group Details")}
              </h3>
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                aria-label={t('Κλείσιμο', 'Close')}
                className="text-gray-400 hover:text-ink p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-gray-50/50 dark:bg-white/5">
              {/* Event Summary */}
              <div className="bg-white dark:bg-surface-raised rounded-2xl shadow-soft border border-gray-100 dark:border-border overflow-hidden">
                <div className="relative h-28 w-full group">
                  <img
                    referrerPolicy="no-referrer"
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h4 className="font-bold text-white text-sm line-clamp-1">
                      {event.title}
                    </h4>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {event.tags.map((tag: string) => (
                        <Link
                          key={tag}
                          to={eventTagPath(tag)}
                          className={cn("inline-flex w-max max-w-none shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide border", gc.tagBadge)}
                        >
                          {translateEventTag(tag, t)}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2.5 text-sm font-medium text-gray-600">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500 shrink-0">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <span className="pt-0.5">
                        {formatPlanWhen(event.date, event.time, language)}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-500 shrink-0">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className="pt-0.5 text-ink font-semibold">
                        {event.exactLocation || event.locationArea}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-50/80 text-blue-800 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                    <span className="text-xs font-semibold tracking-wide">
                      {t(
                        "Άφιξη: 20 λεπτά πριν την εκδήλωση",
                        "Target Arrival: 20 mins before event",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {event.groupDiscount && (
                <div
                  className={`p-4 rounded-2xl border shadow-soft ${group.discountUnlocked ? "bg-emerald-50 border-emerald-200" : "bg-white dark:bg-surface-raised border-gray-100 dark:border-border"}`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className={`p-1.5 rounded-full ${group.discountUnlocked ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 dark:bg-white/10 text-gray-500"}`}
                    >
                      <Tag className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-bold text-sm ${group.discountUnlocked ? "text-emerald-800" : "text-ink"}`}
                    >
                      {t("Ομαδική έκπτωση", "Group Discount")}
                    </span>
                  </div>
                  <p
                    className={`text-xs font-medium leading-relaxed ${group.discountUnlocked ? "text-emerald-700" : "text-gray-500"}`}
                  >
                    {group.discountUnlocked
                      ? t(
                          `Ξεκλειδώθηκε! ${event.groupDiscount.percentage}% έκπτωση εφαρμόστηκε.`,
                          `Unlocked! ${event.groupDiscount.percentage}% off applied to your tickets.`,
                        )
                      : t(
                          `Χρειάζονται ${event.groupDiscount.minSize} μέλη για να ξεκλειδωθεί έκπτωση ${event.groupDiscount.percentage}%.`,
                          `Need ${event.groupDiscount.minSize} members to unlock ${event.groupDiscount.percentage}% off.`,
                        )}
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-surface-raised rounded-2xl shadow-soft border border-gray-100 dark:border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm capitalize tracking-tight text-ink">
                    {t("Μέλη ομάδας", "Group Members")}
                  </h4>
                  <div className="flex items-center gap-2">
                    {isGroupAdmin && (
                      <button
                        onClick={() => setShowAddMemberModal(true)}
                        className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border transition-colors", gc.linkBtn)}
                      >
                        <UserPlus className="w-3 h-3" />{" "}
                        {t("Προσθήκη μελών", "Add Members")}
                      </button>
                    )}
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                      {group.members.length}/{group.targetSize}
                    </span>
                  </div>
                </div>
                <div className="relative mb-4">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={t("Αναζήτηση μελών...", "Search members...")}
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ink bg-gray-50 dark:bg-white/5 transition-all font-medium"
                  />
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {groupMembersDetailed
                    .filter((m) =>
                      m.name
                        .toLowerCase()
                        .includes(memberSearchQuery.toLowerCase()),
                    )
                    .map((member) => {
                      const isCloseToEvent = false;
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-border"
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/15 overflow-hidden shrink-0 relative group shadow-soft border border-gray-100 dark:border-border">
                            {member.photoUrl ? (
                              <img
                                referrerPolicy="no-referrer"
                                src={member.photoUrl}
                                alt={member.name}
                                className={`w-full h-full object-cover transition-all ${!isCloseToEvent && member.id !== currentUser.id ? "blur-sm grayscale opacity-80" : ""}`}
                              />
                            ) : (
                              <div className={cn("w-full h-full flex items-center justify-center font-bold text-xs", gc.avatarPlaceholder)}>
                                {member.name.substring(0, 2)}
                              </div>
                            )}
                            {!isCloseToEvent &&
                              member.id !== currentUser.id && (
                                <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                  <ShieldCheck className="w-4 h-4 text-white mb-0.5" />
                                  <span className="text-xs font-bold text-white tracking-wide text-center px-1">
                                    {t("Κρυφό", "Hidden")}
                                  </span>
                                </div>
                              )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-bold text-ink truncate">
                                {member.name}{" "}
                                {member.id === currentUser.id && (
                                  <span className="text-gray-400 font-medium ml-1">
                                    ({t("Εσείς", "You")})
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 text-xs font-bold flex shrink-0 tracking-wide rounded-lg items-center gap-1 border ${member.reliabilityScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : member.reliabilityScore >= 50 ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}
                              >
                                <ShieldCheck className="h-2.5 w-2.5" />
                                {member.reliabilityScore}%
                              </span>
                              <p
                                className={`text-xs font-bold tracking-wide truncate ${member.reliabilityScore >= 80 ? "text-emerald-600" : member.reliabilityScore >= 50 ? "text-blue-600" : "text-amber-600"}`}
                              >
                                {member.reliabilityScore >= 80
                                  ? t("Υψηλή αξιοπιστία", "Highly Reliable")
                                  : member.reliabilityScore >= 50
                                    ? t("Συχνός", "Frequent")
                                    : t("Χρειάζεται βελτίωση", "Needs Work")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Chat Settings */}
              <div className="bg-white dark:bg-surface-raised rounded-2xl shadow-soft border border-gray-100 dark:border-border p-4 space-y-4">
                <div>
                  <h4 className="font-bold text-sm capitalize tracking-tight text-ink mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />{" "}
                    {t("Ιδιωτικότητα συνομιλίας", "Chat Privacy")}
                  </h4>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">
                        {t("Προσωρινό ιστορικό", "Temporary history")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {t(
                          "Το ιστορικό διαγράφεται 24 ώρες μετά. Πρέπει να συμφωνήσουν όλοι για διατήρηση.",
                          "Chat history deletes automatically 24h after the event. All members must agree to keep it permanently.",
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (isEphemeral) {
                          setShowDisableEphemeralModal(true);
                        } else {
                          setIsEphemeral(true);
                        }
                      }}
                      role="switch"
                      aria-checked={isEphemeral}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 ${isEphemeral ? "bg-ink" : "bg-gray-200 dark:bg-white/15"}`}
                    >
                      <span className="sr-only">{t('Εναλλαγή εφήμερης λειτουργίας', 'Toggle ephemeral mode')}</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-surface-raised shadow ring-0 transition duration-200 ease-in-out ${isEphemeral ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-border">
                  <h4 className="font-bold text-sm capitalize tracking-tight text-ink mb-3 flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-gray-400" />{" "}
                    {t("Άφιξη & χάρτης", "Arrival & map")}
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowStatusModal(true)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-border rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {t("Κατάσταση άφιξης", "Share Arrival Status")}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t(
                            "Γρήγορη ενημέρωση χωρίς χάρτη",
                            "Quickly update the group without map",
                          )}
                        </p>
                      </div>
                      <Clock className="w-4 h-4 text-gray-400" />
                    </button>

                    <button
                      onClick={() => setShowLocationConfigModal(true)}
                      className={cn("w-full flex items-center justify-between px-3 py-2.5 border rounded-lg transition-colors text-left", isSharingLocation ? gc.shareActive : "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-border")}
                    >
                      <div>
                        <p
                          className={cn("text-sm font-bold", isSharingLocation ? gc.shareActiveText : "text-ink")}
                        >
                          {isSharingLocation
                            ? t("Η τοποθεσία κοινοποιείται", "Location Shared")
                            : t(
                                "Κοινοποίηση τοποθεσίας",
                                "Share location",
                              )}
                        </p>
                        <p
                          className={cn("text-xs mt-0.5", isSharingLocation ? gc.shareMutedText : "text-gray-500")}
                        >
                          {isSharingLocation
                            ? t("Διαχείριση ή διακοπή", "Tap to manage or stop")
                            : t(
                                "Προσωρινή, προαιρετική κοινοποίηση",
                                "Temporary, optional sharing",
                              )}
                        </p>
                      </div>
                      <MapPin
                        className={cn("w-4 h-4", isSharingLocation ? gc.accentText : "text-gray-400")}
                      />
                    </button>

                    <button
                      onClick={() => setShowLiveRadarModal(true)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-border rounded-lg transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {t("Χάρτης ομάδας", "Group map")}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {t(
                            "Ζωντανή θέση και ειδοποίηση βοήθειας",
                            "Live pin and a help alert",
                          )}
                        </p>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      onClick={() => setShowSafetyLinkModal(true)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-colors text-left text-emerald-800"
                    >
                      <div>
                        <p className="text-sm font-bold text-emerald-800">
                          {t(
                            "Σύνδεσμος έμπιστης επαφής",
                            "Trusted Contact Link",
                          )}
                        </p>
                        <p className="text-xs text-emerald-600/80 mt-0.5">
                          {t(
                            "Ασφαλής κοινοποίηση εκτός εφαρμογής",
                            "Share securely outside app",
                          )}
                        </p>
                      </div>
                      <Link2 className="h-4 w-4 text-emerald-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full py-2.5 px-4 text-xs font-bold tracking-wide text-red-600 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-lg transition-colors flex justify-center items-center gap-2"
                >
                  {t("Αναφορά προβλήματος", "Report an issue")}
                </button>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full py-2.5 px-4 text-xs font-bold tracking-wide text-gray-500 bg-white dark:bg-surface-raised hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-border rounded-lg transition-colors"
                >
                  {t("Αποχώρηση", "Leave Group")}
                </button>
              </div>
            </div>
          </div>
        )}

        <GroupChatLocationModal
          open={showLocationConfigModal}
          gc={gc}
          isSharingLocation={isSharingLocation}
          locationConfig={locationConfig}
          currentUserName={currentUser?.name ?? ''}
          onClose={() => setShowLocationConfigModal(false)}
          onStartSharing={() => {}}
          onStopSharing={() => {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                senderId: 'system',
                senderName: t("Σύστημα", "System"),
                text: t(
                  `${currentUser?.name} σταμάτησε την κοινοποίηση τοποθεσίας.`,
                  `${currentUser?.name} stopped sharing their location.`,
                ),
                timestamp: new Date().toISOString(),
                type: 'location',
              },
            ]);
            toast.message(t('Η κοινοποίηση τοποθεσίας σταμάτησε', 'Location sharing stopped'));
          }}
          setLocationConfig={setLocationConfig}
          setMessages={setMessages}
          setIsSharingLocation={setIsSharingLocation}
        />

        <Modal
          open={showSafetyLinkModal}
          onClose={() => setShowSafetyLinkModal(false)}
          title={t("Σύνδεσμος έμπιστης επαφής", "Trusted Contact Link")}
          size="sm"
          className="text-center"
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Link2 className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-ink-muted mb-4">
            {t(
              "Προεπισκόπηση demo — ο πραγματικός σύνδεσμος ασφαλείας θα εκδίδεται ανά έξοδο με ανάκληση. Μην τον μοιραστείς ως ενεργό.",
              "Demo preview — a real safety link will be minted per outing with revoke. Do not share this as live.",
            )}
          </p>
          <div className="bg-surface border border-border rounded-lg p-3 mb-4 text-left">
            <p className="text-2xs font-bold tracking-wide text-ink-muted mb-1">
              {t('Demo', 'Demo')}
            </p>
            <span className="text-xs font-medium text-ink-muted break-all">
              https://nakamas.app/safe/demo-preview
            </span>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={() => setShowSafetyLinkModal(false)}
            className="w-full px-4 py-2 min-h-9 text-xs font-bold text-white bg-ink hover:bg-gray-900 rounded-full transition-all duration-200 shadow-soft active:scale-[0.98]"
          >
            {t("Τέλος", "Done")}
          </button>
        </Modal>

        <GroupChatLeaveModal
          open={showLeaveModal}
          eventTitle={event?.title}
          onClose={() => setShowLeaveModal(false)}
          onConfirm={() => {
            const gid = group.id;
            const willHandOver = Boolean(group.waitlist?.length);
            leaveGroup(gid);
            toast.info(t('Αποχώρησες από την ομάδα.', 'You have left the group.'), {
              action: willHandOver
                ? {
                    label: t('Βρες Nakamas', 'Find Nakamas'),
                    onClick: () => navigate('/buddy-seek'),
                  }
                : {
                    label: t('Αναίρεση', 'Undo'),
                    onClick: () => joinGroup(gid),
                  },
            });
            setShowLeaveModal(false);
            navigate('/plans');
          }}
        />

        <Modal
          open={showDisableEphemeralModal}
          onClose={() => setShowDisableEphemeralModal(false)}
          title={t("Διατήρηση ιστορικού;", "Keep Chat History?")}
          size="sm"
          className="text-center"
        >
          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4", gc.panelAccent)}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium leading-relaxed text-ink-muted mb-4">
            {t(
              "Το ιστορικό μένει σε αυτή τη συσκευή.",
              "History stays on this device.",
            )}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              data-autofocus
              onClick={() => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    senderId: "system",
                    senderName: t("Σύστημα", "System"),
                    text: `${currentUser.name} ${t("κράτησε το ιστορικό συνομιλίας σε αυτή τη συσκευή.", "kept chat history on this device.")}`,
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setIsEphemeral(false);
                setShowDisableEphemeralModal(false);
                setShowInfo(false);
                toast.success(t('Το ιστορικό κρατήθηκε σε αυτή τη συσκευή', 'History kept on this device'));
              }}
              className="w-full px-4 py-2 min-h-9 text-xs font-bold text-white bg-ink hover:bg-gray-900 rounded-full transition-all duration-200 shadow-soft active:scale-[0.98]"
            >
              {t("Κράτα ιστορικό εδώ", "Keep history here")}
            </button>
            <button
              type="button"
              onClick={() => setShowDisableEphemeralModal(false)}
              className="w-full px-4 py-2 min-h-9 text-xs font-bold text-ink bg-surface hover:bg-surface-raised rounded-full transition-all duration-200 border border-border active:scale-[0.98]"
            >
              {t("Ακύρωση", "Cancel")}
            </button>
          </div>
        </Modal>

        <GroupChatReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          groupId={group.id}
        />

        <Modal
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          title={t("Κατάσταση άφιξης", "Share Arrival Status")}
          size="sm"
          className="text-center"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const eta = formData.get("eta") as string;
                if (eta) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      senderId: "system",
                      senderName: t("Σύστημα", "System"),
                      text: `${currentUser.name} ${t("ενημέρωσε την κατάστασή του", "updated their ETA")}: ETA ${eta} ${t("λεπτά", "mins")}`,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                  setShowStatusModal(false);
                  toast.success(t('Η κατάσταση κοινοποιήθηκε', 'Status shared'));
                }
              }}
              className="flex gap-2 mb-2"
            >
              <input
                name="eta"
                type="number"
                data-autofocus
                placeholder={t("ETA (λεπτά)", "ETA (mins)")}
                className="flex-1 w-full bg-surface border border-border text-ink text-sm rounded-full px-4 py-2 min-h-9 focus:ring-2 focus:ring-accent/40 focus:border-accent outline-none shadow-soft"
                min="1"
              />
              <button
                type="submit"
                className="px-4 py-2 min-h-9 text-xs font-bold text-white bg-brand hover:bg-brand-strong rounded-full shadow-soft transition-all duration-200 whitespace-nowrap"
              >
                {t("Αποστολή", "Send")}
              </button>
            </form>

            {[
              {
                text: t("Είμαι στον δρόμο", "I'm on my way"),
                color: "bg-ink text-white hover:bg-gray-900",
              },
              {
                text: t("Έφτασα", "I arrived"),
                color: "bg-emerald-600 text-white hover:bg-emerald-700",
              },
              {
                text: t("Θα αργήσω λίγο", "I'll be late"),
                color: "bg-amber-500 text-white hover:bg-amber-600",
              },
              {
                text: t("Είμαι στο σημείο συνάντησης", "I'm at the meeting point"),
                color: gc.primaryBtn,
              },
            ].map((status, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      senderId: "system",
                      senderName: t("Σύστημα", "System"),
                      text: `${currentUser.name} ${t("ενημέρωσε την κατάστασή του", "updated their status")}: "${status.text}"`,
                      timestamp: new Date().toISOString(),
                    },
                  ]);
                  setShowStatusModal(false);
                  toast.success(t('Η κατάσταση κοινοποιήθηκε', 'Status shared'));
                }}
                className={`w-full px-4 py-2 min-h-9 text-xs font-bold rounded-full transition-all duration-200 shadow-soft active:scale-[0.98] ${status.color}`}
              >
                {status.text}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="w-full px-4 py-2 min-h-9 mt-2 text-xs font-bold text-ink bg-surface hover:bg-surface-raised rounded-full transition-all duration-200 border border-border active:scale-[0.98]"
            >
              {t("Ακύρωση", "Cancel")}
            </button>
          </div>
        </Modal>

        <Modal
          open={showAddMemberModal}
          onClose={() => {
            setShowAddMemberModal(false);
            setMemberAddSearchQuery("");
          }}
          title={t("Προσθήκη μελών", "Add Members")}
          size="md"
          className="max-h-[85vh] flex flex-col"
        >
          <p className="text-xs font-medium text-ink-muted -mt-2 mb-4">
            {t(
              "Μπορείς να προσθέσεις όσα άτομα θέλεις σε αυτή την ομάδα.",
              "You can add as many people as you wish to this group.",
            )}
          </p>
          <div className="relative mb-3">
            <Search className="h-4 w-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-autofocus
              placeholder={t("Αναζήτηση με όνομα ή email...", "Search by name or email...")}
              value={memberAddSearchQuery}
              onChange={(e) => setMemberAddSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/40 bg-surface-raised transition-all duration-200 shadow-soft font-medium text-ink"
            />
          </div>
          <div className="max-h-[40vh] overflow-y-auto custom-scrollbar -mx-1 px-1 space-y-1">
            {potentialNewMembers.length > 0 ? (
              potentialNewMembers
                .filter((m) =>
                  m.name.toLowerCase().includes(memberAddSearchQuery.toLowerCase()),
                )
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 hover:bg-surface rounded-2xl transition-all duration-200 border border-transparent hover:border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-surface overflow-hidden shrink-0 border border-border">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={cn("w-full h-full flex items-center justify-center font-bold text-xs", gc.avatarPlaceholder)}>
                            {member.name.substring(0, 2)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-ink truncate">{member.name}</span>
                        <span className="text-xs text-ink-muted font-medium flex items-center gap-1">
                          {formatLocationArea(member.city, language)}{" "}
                          {member.badges.includes("Payment verified") && (
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          )}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        useStore.getState().addMemberToGroup(group.id, member.id);
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            senderId: "system",
                            senderName: t("Σύστημα", "System"),
                            text: `${member.name} ${t("προστέθηκε στην ομάδα από τον διοργανωτή.", "was added to the group by the organizer.")}`,
                            timestamp: new Date().toISOString(),
                          },
                        ]);
                        toast.success(
                          t(`${member.name} προστέθηκε`, `${member.name} added`),
                        );
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1 transition-all duration-200 bg-brand text-white border-brand hover:bg-brand-strong shadow-soft shrink-0"
                    >
                      <UserPlus className="w-3 h-3" /> {t("Προσθήκη", "Add")}
                    </button>
                  </div>
                ))
            ) : (
              <div className="text-center p-5 text-ink-muted flex flex-col items-center">
                <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-ink">
                  {t(
                    "Όλα τα διαθέσιμα άτομα είναι ήδη στην ομάδα!",
                    "All available people are in this group!",
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs font-bold text-ink-muted">
              {t("Τρέχον μέγεθος:", "Current size:")} {group.members.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setShowAddMemberModal(false);
                setMemberAddSearchQuery("");
              }}
              className="px-4 py-1.5 min-h-8 text-xs font-bold text-ink bg-surface-raised hover:bg-surface rounded-full transition-all duration-200 border border-border shadow-soft active:scale-[0.98]"
            >
              {t("Τέλος", "Done")}
            </button>
          </div>
        </Modal>

        <Modal
          open={showLiveRadarModal}
          onClose={() => setShowLiveRadarModal(false)}
          title={t("Χάρτης ομάδας", "Group map")}
          size="lg"
          className="max-w-4xl p-4"
        >
          <div className="min-h-[50vh] -mx-1">
            <LiveEventTracker groupId={group.id} />
          </div>
        </Modal>

        {currentUser && (
          <GroupChatSosModal
            open={showSosConfirm}
            group={group}
            currentUserId={currentUser.id}
            onClose={() => setShowSosConfirm(false)}
            onConfirm={() => {
              const isSos = group?.membersLocations?.[currentUser.id]?.sos;
              useStore.getState().triggerSos(group.id, currentUser.id, !isSos);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  senderId: "system",
                  senderName: t("Σύστημα", "System"),
                  text: !isSos
                    ? `${currentUser.name} ${t("ζήτησε βοήθεια από την ομάδα.", "asked the group for help.")}`
                    : `${currentUser.name} ${t("είναι εντάξει.", "is okay.")}`,
                  timestamp: new Date().toISOString(),
                },
              ]);
              setShowSosConfirm(false);
              if (!isSos) {
                toast.error(t('Η ομάδα ειδοποιήθηκε ότι χρειάζεσαι βοήθεια.', 'The group was told you need help.'));
              } else {
                toast.info(t('Ενημερώθηκε η ομάδα ότι είσαι εντάξει.', 'The group was told you are okay.'));
              }
            }}
          />
        )}

        <ChatCallModal
          open={callMode !== null}
          mode={callMode ?? 'video'}
          title={event.title}
          participants={groupMembersDetailed
            .filter((m) => m.id !== currentUser?.id)
            .map((m) => ({ id: m.id, name: m.name }))}
          onClose={() => setCallMode(null)}
          onEnded={(durationSec, mode) => {
            const convId = conversationId ?? `conv_${group.id}`;
            const label =
              mode === 'video'
                ? t(`Βιντεοκλήση · ${durationSec}δ`, `Video call · ${durationSec}s`)
                : t(`Φωνητική κλήση · ${durationSec}δ`, `Voice call · ${durationSec}s`);
            receiveMessage(convId, label, 'system', 'system');
          }}
        />
      </div>
    </div>
  );
}
