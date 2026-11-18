import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, MoreVertical, MapPin, Filter, UserPlus, UserMinus, Flag, Eye, CalendarPlus, Check, X, ChevronDown, Users, ShieldCheck, Ban } from 'lucide-react';
import { canViewerMessageUser } from '../../lib/profilePrivacy';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { CardInterestLine } from '../common/CardInterestLine';
import { toast } from 'sonner';
import { EmptyState } from '../common/EmptyState';
import { Modal } from '../common/Modal';
import { useStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { stopBubbling, pressable } from '../../lib/a11y';
import { sameInterest } from '../../lib/interests';
import { connectionOutcomeText } from '../../lib/connectionFeedback';
import { profilePathFor } from '../../lib/profileLinks';
import { PersonAvatar } from '../wall/PersonAvatar';

// ─── More dropdown ──────────────────────────────────────────────
function MoreMenu({
  connId: _connId,
  onViewProfile,
  onRemove,
  onReport,
  onBlock,
  onInvite,
}: {
  connId: string;
  onViewProfile: () => void;
  onRemove: () => void;
  onReport: () => void;
  onBlock: () => void;
  onInvite: () => void;
}) {
  const { t } = useLanguage();
  const a = usePageContrast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('Περισσότερες ενέργειες', 'More actions')}
        className={`p-2 min-h-8 min-w-8 flex items-center justify-center rounded-full transition-colors ${a.isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
      >
        <MoreVertical className="w-5 h-5" aria-hidden />
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 top-full mt-1 w-48 rounded-lg border shadow-soft-lg z-fab py-1 text-sm ${a.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button type="button" role="menuitem" onClick={() => { onViewProfile(); setOpen(false); }} className={`w-full px-3 py-1.5 min-h-8 text-left flex items-center gap-2 ${a.isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <Eye className="w-4 h-4" aria-hidden /> {t('Προβολή Προφίλ', 'View Profile')}
          </button>
          <button type="button" role="menuitem" onClick={() => { onInvite(); setOpen(false); }} className={`w-full px-3 py-1.5 min-h-8 text-left flex items-center gap-2 ${a.isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}>
            <CalendarPlus className="w-4 h-4" aria-hidden /> {t('Πρόσκληση σε Εκδήλωση', 'Invite to Event')}
          </button>
          <div className={`my-1 h-px ${a.isDark ? 'bg-gray-700' : 'bg-gray-100'}`} role="separator" />
          <button type="button" role="menuitem" onClick={() => { onRemove(); setOpen(false); }} className="w-full px-3 py-1.5 min-h-8 text-left flex items-center gap-2 text-red-500 hover:bg-red-50/10">
            <UserMinus className="w-4 h-4" aria-hidden /> {t('Αφαίρεση Σύνδεσης', 'Remove Connection')}
          </button>
          <button type="button" role="menuitem" onClick={() => { onReport(); setOpen(false); }} className="w-full px-3 py-1.5 min-h-8 text-left flex items-center gap-2 text-red-500 hover:bg-red-50/10">
            <Flag className="w-4 h-4" aria-hidden /> {t('Αναφορά', 'Report')}
          </button>
          <button type="button" role="menuitem" onClick={() => { onBlock(); setOpen(false); }} className="w-full px-3 py-1.5 min-h-8 text-left flex items-center gap-2 text-red-500 hover:bg-red-50/10">
            <Ban className="w-4 h-4" aria-hidden /> {t('Αποκλεισμός', 'Block')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Trust tier icon ─────────────────────────────────────────────
function TrustBadge({ tier, isDark }: { tier: string; isDark: boolean }) {
  const a = usePageContrast();
  if (tier === '3_high_trust') return <ShieldCheck className={`w-3.5 h-3.5 ${a.trustHigh}`} />;
  if (tier === '2_confirmed') return <ShieldCheck className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />;
  return null;
}

// ─── Main component ──────────────────────────────────────────────
export default function ConnectionsPageContent() {
  const { t, tu } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();

  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const connectionRequests = useStore((s) => s.connectionRequests);
  const acceptConnectionRequest = useStore((s) => s.acceptConnectionRequest);
  const declineConnectionRequest = useStore((s) => s.declineConnectionRequest);
  const restoreConnectionRequest = useStore((s) => s.restoreConnectionRequest);
  const removeConnection = useStore((s) => s.removeConnection);
  const restoreConnection = useStore((s) => s.restoreConnection);
  const sendConnectionRequest = useStore((s) => s.sendConnectionRequest);
  const blockUser = useStore((s) => s.blockUser);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const addNotification = useStore((s) => s.addNotification);
  const ensureDirectConversation = useChatStore((s) => s.ensureDirectConversation);
  const setInboxOpen = useChatStore((s) => s.setInboxOpen);

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggested'>('all');
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'organizer' | 'user'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'mutual' | 'trust'>('name');
  const [inviteForUserId, setInviteForUserId] = useState<string | null>(null);

  const inviteableEvents = useMemo(() => {
    if (!currentUser) return [];
    const memberEventIds = new Set(
      groups.filter((g) => g.members.includes(currentUser.id)).map((g) => g.eventId),
    );
    return events.filter(
      (e) =>
        e.status !== 'cancelled' &&
        e.status !== 'archived' &&
        (e.organizerId === currentUser.id || memberEventIds.has(e.id)),
    );
  }, [events, groups, currentUser]);

  // ─── Computed data ───────────────────────────────────────
  const myConnectionIds = useMemo(() => currentUser?.connections ?? [], [currentUser?.connections]);

  const connections = useMemo(() => {
    const blocked = new Set(blockedUserIds);
    return users
      .filter((u) => myConnectionIds.includes(u.id) && u.id !== currentUser?.id && !blocked.has(u.id))
      .map((u) => {
        const myConns = currentUser?.connections || [];
        const theirConns = u.connections || [];
        const mutual = myConns.filter((id) => theirConns.includes(id) && id !== currentUser?.id && id !== u.id).length;
        const sharedInterests = (currentUser?.interests || []).filter((i) => (u.interests || []).some((x) => sameInterest(x, i)));
        return { ...u, mutual, sharedInterests, role: u.isOrganizer ? t('Διοργανωτής', 'Organizer') : (u.reliabilityScore > 80 ? t('Εξερευνητής', 'Explorer') : t('Αρχάριος', 'Newbie')) };
      });
  }, [users, myConnectionIds, currentUser, blockedUserIds, t]);

  const filteredConnections = useMemo(() => {
    let list = connections;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q));
    }
    if (roleFilter === 'organizer') list = list.filter((c) => c.isOrganizer);
    if (roleFilter === 'user') list = list.filter((c) => !c.isOrganizer);
    if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'mutual') list = [...list].sort((a, b) => b.mutual - a.mutual);
    if (sortBy === 'trust') list = [...list].sort((a, b) => b.reliabilityScore - a.reliabilityScore);
    return list;
  }, [connections, search, roleFilter, sortBy]);

  const pendingRequests = useMemo(() => {
    const blocked = new Set(blockedUserIds);
    return connectionRequests
      .filter((r) => r.toUserId === currentUser?.id && r.status === 'pending' && !blocked.has(r.fromUserId))
      .map((r) => ({ ...r, user: users.find((u) => u.id === r.fromUserId)! }))
      .filter((r) => r.user);
  }, [connectionRequests, currentUser, users, blockedUserIds]);

  const suggested = useMemo(() => {
    const connIds = new Set(myConnectionIds);
    const pendingIds = new Set(connectionRequests.filter((r) => r.status === 'pending').map((r) => r.fromUserId === currentUser?.id ? r.toUserId : r.fromUserId));
    const blocked = new Set(blockedUserIds);
    return users
      .filter((u) => u.id !== currentUser?.id && !connIds.has(u.id) && !pendingIds.has(u.id) && !blocked.has(u.id))
      .map((u) => {
        const sharedInterests = (currentUser?.interests || []).filter((i) => (u.interests || []).some((x) => sameInterest(x, i)));
        return { ...u, sharedInterests };
      })
      .filter((u) => u.sharedInterests.length > 0)
      .sort((a, b) => b.sharedInterests.length - a.sharedInterests.length);
  }, [users, myConnectionIds, connectionRequests, currentUser, blockedUserIds]);

  // ─── Handlers ────────────────────────────────────────────
  const handleMessage = (userId: string) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const peer = users.find((u) => u.id === userId);
    const gate = canViewerMessageUser(currentUser, peer, { blockedUserIds, groups });
    if (!gate.allowed) {
      toast.message(
        t('Δεν μπορείτε να στείλετε μήνυμα', 'Cannot send message'),
        { description: t(gate.reasonEl, gate.reasonEn) },
      );
      return;
    }
    const convId = ensureDirectConversation({
      selfUserId: currentUser.id,
      peerUserId: userId,
      peerName: peer?.name ?? t('Σύνδεση', 'Connection'),
      openWindow: true,
    });
    if (!convId) {
      toast.message(
        t('Οι ιδιωτικές συνομιλίες είναι απενεργοποιημένες', 'Direct chats are disabled'),
        {
          description: t('Ενεργοποιήστε τις στις ρυθμίσεις απορρήτου chat.', 'Enable them in chat privacy settings.'),
          action: {
            label: t('Ρυθμίσεις chat', 'Chat settings'),
            onClick: () => navigate('/settings?section=chat'),
          },
        },
      );
      return;
    }
    setInboxOpen(false);
    toast.success(t(`Συνομιλία με ${peer?.name ?? ''}`, `Chat with ${peer?.name ?? ''}`), {
      action: { label: t('Άνοιγμα', 'Open'), onClick: () => navigate('/chats') },
    });
  };

  const handleBlock = (userId: string, name: string) => {
    blockUser(userId);
    toast.success(t(`Αποκλείστηκε ο/η ${name}`, `Blocked ${name}`));
  };
  const handleInviteToEvent = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    const inviteeId = inviteForUserId;
    const invitee = users.find((u) => u.id === inviteeId);
    const myGroup = currentUser
      ? groups.find((g) => g.eventId === eventId && g.members.includes(currentUser.id))
      : undefined;
    const fromName = currentUser?.name.split(' ')[0] || 'Nakamas';
    if (inviteeId) {
      addNotification({
        type: 'reminder',
        messageGr: `Ο/Η ${fromName} σε προσκάλεσε στην «${ev?.title ?? eventId}» — δες την εκδήλωση.`,
        messageEn: `${fromName} invited you to “${ev?.title ?? eventId}” — open the event.`,
        timeGr: 'μόλις τώρα',
        timeEn: 'just now',
        read: false,
        eventId,
        groupId: myGroup?.id,
        forUserId: inviteeId,
      });
    }
    toast.success(
      t(
        `Πρόσκληση για «${ev?.title ?? eventId}» στάλθηκε${invitee ? ` στον/στην ${invitee.name}` : ''}`,
        `Invite to “${ev?.title ?? eventId}” sent${invitee ? ` to ${invitee.name}` : ''}`,
      ),
      {
        action: {
          label: myGroup ? t('Η βραδιά μας', 'Our night') : t('Εκδήλωση', 'Event'),
          onClick: () => navigate(myGroup ? `/night/${myGroup.id}` : `/events/${eventId}`),
        },
      },
    );
    setInviteForUserId(null);
  };
  const handleViewProfile = (user: { id: string; isOrganizer?: boolean }) => {
    // Organizers open their venue page; everyone else their personal profile & wall.
    navigate(profilePathFor(user));
  };
  const handleRemove = (userId: string, name: string) => {
    removeConnection(userId);
    // Toast + Undo is the recovery path; skip a duplicate system inbox row.
    toast.success(t(`Αφαιρέθηκε η σύνδεση με ${name}`, `Removed connection with ${name}`), {
      action: {
        label: t('Αναίρεση', 'Undo'),
        onClick: () => {
          restoreConnection(userId);
          toast.success(t(`Η σύνδεση με ${name} επανήλθε`, `Connection with ${name} restored`));
        },
      },
    });
  };
  const handleAccept = (requestId: string, name: string) => {
    // Store already notifies the requester → Wall; toast is enough for the acceptor.
    acceptConnectionRequest(requestId);
    toast.success(t(`Αποδεχτήκατε τη σύνδεση με ${name}`, `Accepted connection with ${name}`), {
      action: {
        label: t('Τοίχος', 'Wall'),
        onClick: () => navigate('/wall'),
      },
    });
  };
  const handleDecline = (requestId: string, name?: string) => {
    declineConnectionRequest(requestId);
    toast.info(
      name
        ? t(`Απορρίφθηκε το αίτημα από ${name}`, `Declined request from ${name}`)
        : t('Το αίτημα απορρίφθηκε', 'Request declined'),
      {
        action: {
          label: t('Αναίρεση', 'Undo'),
          onClick: () => {
            restoreConnectionRequest(requestId);
          },
        },
      },
    );
  };
  const handleConnect = (userId: string, name: string) => {
    const outcome = sendConnectionRequest(userId);
    const feedback = connectionOutcomeText(outcome, name, t);
    // Live toast confirms the action; inbox stays for cross-user loops only.
    if (outcome === 'accepted') {
      toast.success(feedback.text, {
        action: { label: t('Τοίχος', 'Wall'), onClick: () => navigate('/wall') },
      });
    } else {
      toast[feedback.tone](feedback.text);
    }
  };

  // ─── Render ──────────────────────────────────────────────
  const subColor = a.sub;
  const inputClasses = a.isDark
    ? `bg-gray-800 border-gray-700 text-white placeholder-gray-400 ${a.ring}`
    : `bg-white border-gray-200 text-gray-900 placeholder-gray-400 ${a.ring}`;

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={cn('text-lg md:text-xl font-bold tracking-tight leading-tight', a.head)}>{t('Οι Συνδέσεις μου', 'My Nakamas')}</h1>
          <p className={`font-medium text-sm mt-1 ${subColor}`}>{t('Άτομα με τα οποία συνδεθήκατε μέσα από εκδηλώσεις.', 'People you\'ve connected with through events.')}</p>
        </div>
        <Button variant="primary" size="sm" className="flex items-center gap-2" onClick={() => navigate('/buddy-seek')}>
          <Users className="w-4 h-4" /> {t('Βρες Nakamas', 'Find Nakamas')}
        </Button>
      </div>

      {/* Tabs — rounded-lg pills */}
      <div className="flex gap-2 flex-wrap" role="tablist" aria-label={t('Ενότητες συνδέσεων', 'Connections sections')}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'all'}
          className={cn('px-3 py-1.5 min-h-8 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5', activeTab === 'all' ? a.chipActive : a.chipInactive)}
          onClick={() => setActiveTab('all')}
        >
          {t('Συνδέσεις', 'Connections')}
          <span className="font-semibold text-2xs">({connections.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'requests'}
          className={cn('px-3 py-1.5 min-h-8 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5', activeTab === 'requests' ? a.chipActive : a.chipInactive)}
          onClick={() => setActiveTab('requests')}
        >
          {t('Αιτήματα', 'Requests')}
          {pendingRequests.length > 0 && <span className={`${a.requestBadge} text-white text-2xs min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center`}>{pendingRequests.length}</span>}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'suggested'}
          className={cn('px-3 py-1.5 min-h-8 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5', activeTab === 'suggested' ? a.chipActive : a.chipInactive)}
          onClick={() => setActiveTab('suggested')}
        >
          <UserPlus className="w-3.5 h-3.5" aria-hidden /> {t('Προτάσεις', 'Suggested')}
          {suggested.length > 0 && <span className={`${a.isDark ? 'bg-gray-600' : 'bg-gray-400'} text-white text-2xs min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center`}>{suggested.length}</span>}
        </button>
      </div>

      {/* Search + Filter (only on connections tab) */}
      {activeTab === 'all' && (
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${a.muted}`} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Αναζήτηση συνδέσεων...', 'Search connections...')}
              className={`w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${inputClasses}`}
            />
          </div>
          <div className="relative">
            <Button variant="outline" className="shrink-0 flex items-center gap-2" onClick={() => setFilterOpen(!filterOpen)}>
              <Filter className="w-4 h-4" /> {t('Φίλτρα', 'Filter')} <ChevronDown className="w-3 h-3" />
            </Button>
            {filterOpen && (
              <div className={`absolute right-0 top-full mt-1 w-56 rounded-lg border shadow-soft-lg z-fab p-3 space-y-3 ${a.isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${a.muted}`}>{tu('Ρόλος', 'Role')}</label>
                  <div className="flex gap-1 mt-1">
                    {(['all', 'organizer', 'user'] as const).map((r) => (
                      <button key={r} onClick={() => setRoleFilter(r)} className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${roleFilter === r ? a.acceptBtn : (a.isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                        {r === 'all' ? t('Όλοι', 'All') : r === 'organizer' ? t('Διοργανωτής', 'Organizer') : t('Χρήστης', 'User')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-bold uppercase tracking-wider ${a.muted}`}>{tu('Ταξινόμηση', 'Sort')}</label>
                  <div className="flex gap-1 mt-1">
                    {(['name', 'mutual', 'trust'] as const).map((s) => (
                      <button key={s} onClick={() => setSortBy(s)} className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${sortBy === s ? a.acceptBtn : (a.isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}>
                        {s === 'name' ? t('Όνομα', 'Name') : s === 'mutual' ? t('Κοινοί', 'Mutual') : t('Εμπιστοσύνη', 'Trust')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONNECTIONS TAB ═══ */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredConnections.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Users}
                character={search ? undefined : 'crew'}
                title={search ? t('Δεν βρέθηκαν αποτελέσματα', 'No results found') : t('Δεν έχετε συνδέσεις ακόμα', 'No connections yet')}
                description={t('Βρείτε Nakamas στις εκδηλώσεις!', 'Find Nakamas at events!')}
                actionLabel={search ? t('Καθαρισμός', 'Clear') : t('Εξερεύνηση', 'Explore')}
                onAction={search ? () => setSearch('') : () => navigate('/')}
                secondaryLabel={search ? undefined : t('Βρες Nakamas', 'Find Nakamas')}
                onSecondary={search ? undefined : () => navigate('/buddy-seek')}
              />
            </div>
          )}
          {filteredConnections.map((conn) => (
            <Card key={conn.id} className={`p-4 flex items-center justify-between ${a.cardHover} transition-colors cursor-pointer group`} onClick={() => handleViewProfile(conn)} containsControls>
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <PersonAvatar user={conn} className="h-12 w-12 text-xs" />
                  <TrustBadge tier={conn.trustTier} isDark={a.isDark} />
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-sm truncate ${a.head} ${a.hoverText} transition-colors`}>
                    <button type="button" className="max-w-full truncate text-left rounded-sm outline-none focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" onClick={(e) => { e.stopPropagation(); handleViewProfile(conn); }}>
                      {conn.name}
                    </button>
                  </h3>
                  <p className={`card-meta flex items-center gap-1 mt-0.5 ${a.muted}`}>
                    <MapPin className="w-3 h-3 shrink-0" aria-hidden /> {conn.city}
                    <span aria-hidden className="opacity-40">·</span>
                    <span className="capitalize">{conn.role}</span>
                    <span aria-hidden className="opacity-40">·</span>
                    <span>{conn.mutual} {t('Κοινοί', 'mutuals')}</span>
                  </p>
                  {conn.sharedInterests.length > 0 && (
                    <CardInterestLine
                      items={conn.sharedInterests}
                      max={3}
                      className={`mt-1.5 ${a.muted}`}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" {...stopBubbling}>
                <button
                  type="button"
                  onClick={() => handleMessage(conn.id)}
                  className={`p-2 min-h-8 min-w-8 flex items-center justify-center rounded-full transition-colors ${a.msgIcon}`}
                  title={t('Ιδιωτικό μήνυμα', 'Direct message')}
                  aria-label={t('Ιδιωτικό μήνυμα', 'Direct message')}
                >
                  <MessageCircle className="w-5 h-5" aria-hidden />
                </button>
                <MoreMenu
                  connId={conn.id}
                  onViewProfile={() => handleViewProfile(conn)}
                  onRemove={() => handleRemove(conn.id, conn.name)}
                  onReport={() => navigate('/report')}
                  onBlock={() => handleBlock(conn.id, conn.name)}
                  onInvite={() => setInviteForUserId(conn.id)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={inviteForUserId !== null}
        onClose={() => setInviteForUserId(null)}
        title={t('Πρόσκληση σε εκδήλωση', 'Invite to event')}
      >
        {inviteableEvents.length === 0 ? (
          <div className="space-y-3">
            <p className={`card-copy ${a.muted}`}>
              {t(
                'Δεν έχετε διαθέσιμες εκδηλώσεις. Δημιουργήστε μία ή μπείτε σε ομάδα.',
                'No events available. Create one or join a group first.',
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { setInviteForUserId(null); navigate('/create'); }}>
                {t('Δημιουργία εκδήλωσης', 'Create event')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setInviteForUserId(null);
                  navigate('/buddy-seek');
                }}
              >
                {t('Βρες Nakamas', 'Find Nakamas')}
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {inviteableEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => handleInviteToEvent(ev.id)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 min-h-8 rounded-xl border text-xs font-semibold transition-colors',
                    a.isDark ? 'border-gray-700 hover:bg-gray-800 text-gray-100' : 'border-gray-200 hover:bg-gray-50 text-gray-900',
                  )}
                >
                  {ev.title}
                  <span className={`block text-xs font-medium mt-0.5 ${a.muted}`}>
                    {ev.date} · {ev.locationArea}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* ═══ REQUESTS TAB ═══ */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 && (
            <EmptyState
              icon={UserPlus}
              title={t('Δεν υπάρχουν αιτήματα', 'No pending requests')}
              description={t(
                'Θα ειδοποιηθείτε όταν κάποιος θέλει να συνδεθεί.',
                "You'll be notified when someone wants to connect.",
              )}
              actionLabel={t('Βρες Nakamas', 'Find Nakamas')}
              onAction={() => navigate('/buddy-seek')}
            />
          )}
          {pendingRequests.map((req) => (
            <Card key={req.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 cursor-pointer rounded-lg" {...pressable<HTMLDivElement>(() => handleViewProfile(req.user))}>
                  <PersonAvatar user={req.user} className="h-12 w-12 text-xs" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${a.head}`}>{req.user.name}</h3>
                      {req.user.isOrganizer && (
                        <span className={`card-meta font-medium ${a.muted}`}>{t('Διοργανωτής', 'Organizer')}</span>
                      )}
                    </div>
                    <p className={`card-meta flex items-center gap-1 mt-0.5 ${a.muted}`}>
                      <MapPin className="w-3 h-3 shrink-0" aria-hidden /> {req.user.city}
                    </p>
                    {req.message && <p className={`text-xs mt-1.5 italic ${a.isDark ? 'text-gray-300' : 'text-gray-600'}`}>"{req.message}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id, req.user.name)}
                    className={`flex items-center gap-1 px-3 py-1.5 min-h-8 rounded-lg text-xs font-bold transition-colors ${a.acceptBtn}`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden /> {t('Αποδοχή', 'Accept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(req.id, req.user.name)}
                    aria-label={t('Απόρριψη αιτήματος', 'Decline request')}
                    className={`p-2 min-h-8 min-w-8 flex items-center justify-center rounded-lg transition-colors ${a.isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}
                  >
                    <X className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ═══ SUGGESTED TAB ═══ */}
      {activeTab === 'suggested' && (
        <div className="space-y-4">
          {suggested.length === 0 && (
            <EmptyState
              icon={Users}
              title={t('Δεν υπάρχουν προτάσεις', 'No suggestions yet')}
              description={t('Συμμετέχετε σε εκδηλώσεις για να βρείτε Nakamas!', 'Join events to find Nakamas!')}
              actionLabel={t('Εξερεύνηση', 'Explore')}
              onAction={() => navigate('/')}
              secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
              onSecondary={() => navigate('/buddy-seek')}
            />
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suggested.map((user) => (
              <Card key={user.id} className={`p-4 ${a.cardHover} transition-colors cursor-pointer group`} onClick={() => handleViewProfile(user)} containsControls>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <PersonAvatar user={user} className="h-12 w-12 text-xs" />
                    <div className="min-w-0">
                      <h3 className={`font-bold text-sm truncate ${a.head} ${a.hoverText} transition-colors`}>
                        <button type="button" className="max-w-full truncate text-left rounded-sm outline-none focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" onClick={(e) => { e.stopPropagation(); handleViewProfile(user); }}>
                          {user.name}
                        </button>
                      </h3>
                      <p className={`card-meta flex items-center gap-1 mt-0.5 ${a.muted}`}>
                        <MapPin className="w-3 h-3 shrink-0" aria-hidden /> {user.city}
                        {user.isOrganizer && (
                          <>
                            <span aria-hidden className="opacity-40">·</span>
                            <span>{t('Διοργανωτής', 'Organizer')}</span>
                          </>
                        )}
                      </p>
                      {user.sharedInterests.length > 0 && (
                        <CardInterestLine items={user.sharedInterests} max={3} className={`mt-1.5 ${a.muted}`} />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleConnect(user.id, user.name); }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${a.acceptBtn}`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> {t('Σύνδεση', 'Connect')}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
