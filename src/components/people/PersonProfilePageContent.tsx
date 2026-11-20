import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Ban,
  CalendarDays,
  Check,
  Eye,
  Flag,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  Newspaper,
  Pencil,
  Settings2,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { TabBar } from '../common/TabBar';
import { EmptyState } from '../common/EmptyState';
import { AppSelect } from '../common/AppSelect';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useChatStore } from '../../store/chatStore';
import { useWallAccess, useWallStore } from '../../store/wallStore';
import {
  canPostOnWall,
  canViewProfileSection,
  connectionIdsOf,
  graphConnected,
  mutualConnectionIds,
  profileWallPosts,
  type WallAccessContext,
} from '../../lib/audience';
import { canViewerMessageUser, canViewerSeeProfile } from '../../lib/profilePrivacy';
import { profilePathFor } from '../../lib/profileLinks';
import { connectionOutcomeText } from '../../lib/connectionFeedback';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import { interestLabel, sameInterest } from '../../lib/interests';
import { APP_TYPO } from '../../lib/typographyTokens';
import { PAGE_FILL } from '../layout/PageShell';
import { cn } from '../../lib/utils';
import type { ProfileSectionKey } from '../../types/wall';
import type { User } from '../../types';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { PersonAvatar } from '../wall/PersonAvatar';
import { PostComposer } from '../wall/PostComposer';
import { WallPostList } from '../wall/WallPostList';
import { OverflowMenu } from '../wall/OverflowMenu';

type Tab = 'wall' | 'about' | 'nakamas' | 'events';
const TABS: Tab[] = ['wall', 'about', 'nakamas', 'events'];
const PUBLIC_PREVIEW_ID = '__public_preview__';

/** Viewer used by «Δες ως: Δημόσιο» — a signed-in member with no shared connections. */
const PUBLIC_PREVIEW_VIEWER: User = {
  id: PUBLIC_PREVIEW_ID,
  name: 'Nakamas member',
  ageRange: '',
  city: '',
  interests: [],
  trustTier: '1_explorer',
  reliabilityScore: 0,
  badges: [],
  emailVerified: true,
  phoneVerified: false,
  paymentVerified: false,
  idVerified: false,
  isOrganizer: false,
  connections: [],
};

function LockedSection({ name, what }: { name: string; what: string }) {
  const { t } = useLanguage();
  return (
    <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-4 text-sm font-medium text-ink-muted">
      <Lock className="h-4 w-4 shrink-0" aria-hidden />
      {t(`Ο/Η ${name} κρατά «${what}» ιδιωτικό για σένα.`, `${name} keeps “${what}” private from you.`)}
    </p>
  );
}

/**
 * Personal profile & wall (`/u/:id`) — Φ26. Organizers keep their venue page
 * (`/organizer/:id`). Every block on this page passes through the same ACL
 * the store uses, and the owner can preview it «ως» someone else.
 */
export default function PersonProfilePageContent() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();

  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const groups = useStore((s) => s.groups);
  const events = useStore((s) => s.events);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const connectionRequests = useStore((s) => s.connectionRequests);
  const sendConnectionRequest = useStore((s) => s.sendConnectionRequest);
  const cancelConnectionRequest = useStore((s) => s.cancelConnectionRequest);
  const acceptConnectionRequest = useStore((s) => s.acceptConnectionRequest);
  const declineConnectionRequest = useStore((s) => s.declineConnectionRequest);
  const removeConnection = useStore((s) => s.removeConnection);
  const restoreConnection = useStore((s) => s.restoreConnection);
  const blockUser = useStore((s) => s.blockUser);
  const ensureDirectConversation = useChatStore((s) => s.ensureDirectConversation);
  const posts = useWallStore((s) => s.posts);
  const lists = useWallStore((s) => s.lists);
  const access = useWallAccess();
  const [blockOpen, setBlockOpen] = useState(false);

  const subject = users.find((u) => u.id === id);
  const isSelf = Boolean(me && subject && me.id === subject.id);
  const viewAsParam = isSelf ? searchParams.get('viewAs') : null;
  const viewAsUser = viewAsParam && viewAsParam !== 'public' ? users.find((u) => u.id === viewAsParam) : undefined;
  const viewer: User | null = viewAsParam === 'public' ? PUBLIC_PREVIEW_VIEWER : viewAsUser ?? me;
  const previewing = Boolean(isSelf && viewer && viewer.id !== me?.id);

  // In «Δες ως…» the simulated person is part of the graph with their own blocks.
  const viewerAccess: WallAccessContext = useMemo(() => {
    if (!previewing || !viewer) return access;
    const graphUsers = access.graph.users.some((u) => u.id === viewer.id) ? access.graph.users : [...access.graph.users, viewer];
    return { ...access, graph: { ...access.graph, users: graphUsers, viewerBlockedIds: viewer.blockedUserIds ?? [] } };
  }, [access, previewing, viewer]);

  const tabParam = searchParams.get('tab') as Tab | null;
  const activeTab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : 'wall';
  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'wall') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };
  const setViewAs = (value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('viewAs', value);
    else next.delete('viewAs');
    setSearchParams(next, { replace: true });
  };

  const viewerId = viewer?.id ?? null;
  const profileAccess = useMemo(
    () =>
      subject
        ? canViewerSeeProfile(viewer, subject, {
            blockedUserIds: previewing ? viewer?.blockedUserIds ?? [] : blockedUserIds,
            groups,
            users: viewerAccess.graph.users,
            lists,
          })
        : null,
    [subject, viewer, previewing, blockedUserIds, groups, viewerAccess.graph.users, lists],
  );

  const wallPosts = useMemo(
    () => (subject ? profileWallPosts(viewerId, subject.id, posts, viewerAccess) : []),
    [subject, viewerId, posts, viewerAccess],
  );

  usePublishPageSnapshot({
    titleEl: subject ? `Προφίλ: ${subject.name}` : 'Προφίλ',
    titleEn: subject ? `Profile: ${subject.name}` : 'Profile',
    summaryEl: `${wallPosts.length} ορατές δημοσιεύσεις`,
    summaryEn: `${wallPosts.length} visible posts`,
  });

  if (!me) return null;
  if (!subject) {
    return (
      <EmptyState
        icon={Users}
        title={t('Το προφίλ δεν βρέθηκε', 'Profile not found')}
        description={t('Ίσως ο σύνδεσμος είναι παλιός ή ο λογαριασμός δεν υπάρχει πια.', 'The link may be old or the account no longer exists.')}
        actionLabel={t('Οι Nakamas μου', 'My Nakamas')}
        onAction={() => navigate('/connections')}
        secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
        onSecondary={() => navigate('/buddy-seek')}
      />
    );
  }
  if (subject.isOrganizer) return <Navigate to={profilePathFor(subject)} replace />;

  const connected = graphConnected(access.graph, me.id, subject.id);
  const outgoing = connectionRequests.find((r) => r.fromUserId === me.id && r.toUserId === subject.id && r.status === 'pending');
  const incoming = connectionRequests.find((r) => r.fromUserId === subject.id && r.toUserId === me.id && r.status === 'pending');
  const iBlocked = blockedUserIds.includes(subject.id);
  const mutualIds = isSelf ? [] : mutualConnectionIds(access.graph, me.id, subject.id);
  const sharedInterests = isSelf ? [] : (subject.interests ?? []).filter((i) => (me.interests ?? []).some((x) => sameInterest(x, i)));
  const can = (key: ProfileSectionKey) => Boolean(viewerId && canViewProfileSection(viewerId, subject.id, key, viewerAccess));
  const hidden = !profileAccess?.allowed || profileAccess.level === 'hidden';
  const wallGate = viewerId ? canPostOnWall(viewerId, subject.id, viewerAccess) : null;

  const handleConnect = () => {
    const outcome = sendConnectionRequest(subject.id);
    const fb = connectionOutcomeText(outcome, subject.name, t);
    toast[fb.tone](fb.text);
  };

  const handleRemove = () => {
    removeConnection(subject.id);
    toast.success(t(`Αφαιρέθηκε η σύνδεση με ${subject.name}`, `Removed connection with ${subject.name}`), {
      action: { label: t('Αναίρεση', 'Undo'), onClick: () => restoreConnection(subject.id) },
    });
  };

  const handleMessage = () => {
    const gate = canViewerMessageUser(me, subject, { blockedUserIds, groups });
    if (!gate.allowed) {
      toast.message(t('Δεν μπορείτε να στείλετε μήνυμα', 'Cannot send message'), { description: t(gate.reasonEl, gate.reasonEn) });
      return;
    }
    const conv = ensureDirectConversation({ selfUserId: me.id, peerUserId: subject.id, peerName: subject.name, openWindow: true });
    if (!conv) {
      toast.message(t('Οι ιδιωτικές συνομιλίες είναι απενεργοποιημένες', 'Direct chats are disabled'), {
        description: t('Ενεργοποιήστε τις στις ρυθμίσεις απορρήτου chat.', 'Enable them in chat privacy settings.'),
        action: { label: t('Ρυθμίσεις chat', 'Chat settings'), onClick: () => navigate('/settings?section=chat') },
      });
      return;
    }
  };

  const handleBlock = () => {
    blockUser(subject.id);
    setBlockOpen(false);
    toast.success(t(`Αποκλείστηκε ο/η ${subject.name}`, `Blocked ${subject.name}`), {
      description: t('Μπορείς να το αναιρέσεις από Ρυθμίσεις › Μπλοκαρισμένοι.', 'You can undo this in Settings › Blocked users.'),
    });
    navigate('/connections');
  };

  const myConnections = connectionIdsOf(access.graph, me.id);
  const theirConnections = connectionIdsOf(viewerAccess.graph, subject.id)
    .map((cid) => users.find((u) => u.id === cid))
    .filter((u): u is User => Boolean(u) && !blockedUserIds.includes(u!.id))
    .sort((a, b) => Number(mutualIds.includes(b.id)) - Number(mutualIds.includes(a.id)) || a.name.localeCompare(b.name));

  const theirEvents = events
    .filter((e) => groups.some((g) => g.eventId === e.id && g.status !== 'cancelled' && (g.members.includes(subject.id) || g.hostId === subject.id)) || e.organizerId === subject.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  /* ───────────── actions row ───────────── */
  const actions = isSelf ? (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={() => navigate('/profile')} className="gap-1.5">
        <Pencil className="h-3.5 w-3.5" aria-hidden /> {t('Επεξεργασία προφίλ', 'Edit profile')}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => navigate('/profile?tab=privacy')} className="gap-1.5">
        <Settings2 className="h-3.5 w-3.5" aria-hidden /> {t('Απόρρητο', 'Privacy')}
      </Button>
    </div>
  ) : iBlocked ? null : (
    <div className="flex flex-wrap items-center gap-2">
      {connected ? (
        <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-accent-soft px-3 text-xs font-bold text-ink">
          <UserCheck className="h-3.5 w-3.5" aria-hidden /> {t('Είστε Nakamas', 'You are Nakamas')}
        </span>
      ) : incoming ? (
        <>
          <Button
            size="sm"
            onClick={() => {
              acceptConnectionRequest(incoming.id);
              toast.success(t(`Είστε πλέον Nakamas με ${subject.name}`, `You are now Nakamas with ${subject.name}`), {
                action: { label: t('Τοίχος', 'Wall'), onClick: () => navigate('/wall') },
              });
            }}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" aria-hidden /> {t('Αποδοχή αιτήματος', 'Accept request')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { declineConnectionRequest(incoming.id); toast.info(t('Το αίτημα απορρίφθηκε', 'Request declined')); }} className="gap-1.5">
            <X className="h-3.5 w-3.5" aria-hidden /> {t('Απόρριψη', 'Decline')}
          </Button>
        </>
      ) : outgoing ? (
        <Button size="sm" variant="outline" onClick={() => { cancelConnectionRequest(subject.id); toast.info(t('Το αίτημα ακυρώθηκε', 'Request withdrawn')); }} className="gap-1.5">
          <X className="h-3.5 w-3.5" aria-hidden /> {t('Ακύρωση αιτήματος', 'Withdraw request')}
        </Button>
      ) : (
        <Button size="sm" onClick={handleConnect} className="gap-1.5">
          <UserPlus className="h-3.5 w-3.5" aria-hidden /> {t('Σύνδεση', 'Connect')}
        </Button>
      )}
      {!hidden && (
        <Button size="sm" variant="outline" onClick={handleMessage} className="gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden /> {t('Μήνυμα', 'Message')}
        </Button>
      )}
      <OverflowMenu
        label={t(`Περισσότερα για ${subject.name}`, `More about ${subject.name}`)}
        items={[
          ...(connected
            ? [{ key: 'remove', icon: UserMinus, label: t('Αφαίρεση σύνδεσης', 'Remove connection'), onSelect: handleRemove }]
            : []),
          { key: 'report', icon: Flag, label: t('Αναφορά προφίλ', 'Report profile'), onSelect: () => navigate('/report'), danger: true },
          { key: 'block', icon: Ban, label: t(`Αποκλεισμός ${subject.name}`, `Block ${subject.name}`), onSelect: () => setBlockOpen(true), danger: true },
        ]}
      />
    </div>
  );

  const viewAsBar = isSelf && (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3', previewing ? 'border-accent bg-accent-soft' : 'border-border bg-surface-raised')} role={previewing ? 'status' : undefined}>
      <Eye className="h-4 w-4 shrink-0 text-ink" aria-hidden />
      <label htmlFor="view-as" className="text-sm font-bold text-ink">
        {previewing ? t('Βλέπεις το προφίλ σου όπως το βλέπει:', 'You are viewing your profile as:') : t('Δες το προφίλ σου ως:', 'View your profile as:')}
      </label>
      <AppSelect
        id="view-as"
        ariaLabel={previewing ? t('Βλέπεις το προφίλ σου όπως το βλέπει:', 'You are viewing your profile as:') : t('Δες το προφίλ σου ως:', 'View your profile as:')}
        value={viewAsParam ?? ''}
        onValueChange={(v) => setViewAs(v || null)}
        className="filter-select min-h-9 rounded-full border border-border bg-surface px-3 text-xs font-bold text-ink"
        options={[
          { value: '', label: t('Εσύ (πλήρες)', 'You (full)') },
          { value: 'public', label: t('Μέλος του δικτύου (όχι Nakamas)', 'Network member (not a Nakama)') },
          ...myConnections.flatMap((cid) => {
            const u = users.find((x) => x.id === cid);
            return u ? [{ value: cid, label: u.name }] : [];
          }),
        ]}
      />
      {previewing && (
        <button type="button" onClick={() => setViewAs(null)} className="ml-auto min-h-9 text-xs font-bold text-ink underline">
          {t('Έξοδος προεπισκόπησης', 'Exit preview')}
        </button>
      )}
    </div>
  );

  /* ───────────── hidden profile ───────────── */
  if (hidden) {
    return (
      <div className={cn(PAGE_FILL, 'space-y-4 pb-20 md:pb-6')}>
        {viewAsBar}
        <Card className="p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface">
            <Lock className="h-7 w-7 text-ink-muted" aria-hidden />
          </div>
          <h1 className={cn(APP_TYPO.pageTitle, 'mt-3 text-ink')}>{previewing || connected || outgoing || incoming ? subject.name : t('Ιδιωτικό προφίλ', 'Private profile')}</h1>
          <p className="mx-auto mt-1 max-w-md text-sm font-medium text-ink-muted">{t(profileAccess?.reasonEl ?? '', profileAccess?.reasonEn ?? '')}</p>
          {!previewing && !iBlocked && <div className="mt-4 flex justify-center">{actions}</div>}
        </Card>
        {previewing && (
          <p className="text-center text-xs font-medium text-ink-muted">
            {t('Έτσι βλέπουν το προφίλ σου όσοι δεν είναι στο κοινό του. Άλλαξέ το στο Απόρρητο.', 'This is what people outside your profile audience see. Change it in Privacy.')}
          </p>
        )}
        <BlockModal open={blockOpen} name={subject.name} onClose={() => setBlockOpen(false)} onConfirm={handleBlock} />
      </div>
    );
  }

  /* ───────────── full profile ───────────── */
  const tierText = t(tierLabelEl(subject.trustTier), tierLabelEn(subject.trustTier));
  const aboutVisible = can('about');

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-20 md:pb-6 animate-in fade-in duration-300')}>
      {viewAsBar}

      <Card className="overflow-hidden p-0">
        <div className="h-20 bg-gradient-to-r from-[var(--color-hero-accent-from)] to-[var(--color-hero-accent-to)] opacity-60" aria-hidden />
        <div className="-mt-10 px-4 pb-4">
          <PersonAvatar user={subject} size="lg" viewer={viewer} className="border-4 border-[var(--color-surface-raised)]" />
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className={cn(APP_TYPO.pageTitle, 'text-ink')}>{subject.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-muted">
                {aboutVisible && subject.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden /> {subject.city}
                  </span>
                )}
                {aboutVisible && subject.ageRange && <span>{subject.ageRange}</span>}
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" aria-hidden /> {tierText}
                </span>
                {/* Φ27 — selfie check badge (result only; no image is ever kept). */}
                {subject.selfieVerified && (
                  <span className="inline-flex items-center gap-1 font-bold text-ink" title={t('Επαληθευμένο με selfie', 'Verified with a selfie')}>
                    <ShieldCheck className="h-3 w-3" aria-hidden /> Selfie ✓
                  </span>
                )}
              </div>
              {!isSelf && (mutualIds.length > 0 || sharedInterests.length > 0) && (
                <p className="mt-1 text-xs font-bold text-ink">
                  {[
                    mutualIds.length > 0 && (mutualIds.length === 1 ? t('1 κοινός Nakama', '1 mutual Nakama') : t(`${mutualIds.length} κοινοί Nakamas`, `${mutualIds.length} mutual Nakamas`)),
                    sharedInterests.length > 0 && (sharedInterests.length === 1 ? t('1 κοινό ενδιαφέρον', '1 shared interest') : t(`${sharedInterests.length} κοινά ενδιαφέροντα`, `${sharedInterests.length} shared interests`)),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
            {!previewing && actions}
          </div>
          {aboutVisible && subject.bio && <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-ink">{subject.bio}</p>}
        </div>
      </Card>

      <TabBar
        variant="segmented"
        idBase="person"
        ariaLabel={t('Ενότητες προφίλ', 'Profile sections')}
        activeTab={activeTab}
        onChange={setTab}
        tabs={[
          { id: 'wall', label: t('Τοίχος', 'Wall'), icon: Newspaper, count: wallPosts.length },
          { id: 'about', label: t('Σχετικά', 'About'), icon: Info },
          { id: 'nakamas', label: t('Nakamas', 'Nakamas'), icon: Users },
          { id: 'events', label: t('Εκδηλώσεις', 'Events'), icon: CalendarDays },
        ]}
      />

      <div role="tabpanel" id={`person-panel-${activeTab}`} aria-labelledby={`person-tab-${activeTab}`} className="space-y-3">
        {activeTab === 'wall' && (
          <>
            {!previewing && wallGate?.allowed && <PostComposer key={subject.id} wallOwnerId={subject.id} />}
            {!previewing && !isSelf && wallGate && !wallGate.allowed && (
              <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-xs font-medium text-ink-muted" role="note">
                <Lock className="h-4 w-4 shrink-0" aria-hidden /> {t(wallGate.reasonEl, wallGate.reasonEn)}
              </p>
            )}
            {wallPosts.length === 0 ? (
              <EmptyState
                icon={Newspaper}
                title={isSelf && !previewing ? t('Ο τοίχος σου είναι άδειος', 'Your wall is empty') : t('Καμία δημοσίευση για εσένα ακόμα', 'Nothing shared with you yet')}
                description={
                  isSelf && !previewing
                    ? t('Γράψε τι σχεδιάζεις — εσύ επιλέγεις ποιος το βλέπει.', 'Share what you are planning — you choose who sees it.')
                    : t(`Βλέπεις μόνο ό,τι μοιράζεται ο/η ${subject.name} μαζί σου.`, `You only see what ${subject.name} shares with you.`)
                }
                actionLabel={
                  isSelf && !previewing
                    ? t('Γράψε δημοσίευση', 'Write a post')
                    : t('Βρες Nakamas', 'Find Nakamas')
                }
                onAction={() => {
                  if (isSelf && !previewing) {
                    document.querySelector<HTMLTextAreaElement>('[data-testid="wall-composer"] textarea')?.focus();
                  } else {
                    navigate('/buddy-seek');
                  }
                }}
              />
            ) : (
              <WallPostList key={`${subject.id}-${viewerId}`} posts={wallPosts} viewerOverride={previewing ? viewer : undefined} />
            )}
          </>
        )}

        {activeTab === 'about' && (
          <Card className="space-y-4 p-4">
            {aboutVisible ? (
              <div className="space-y-2">
                <h2 className={cn(APP_TYPO.sectionLabel, 'text-ink-muted')}>{t('Σχετικά', 'About')}</h2>
                <p className="whitespace-pre-wrap text-sm font-medium text-ink">{subject.bio || t('Δεν έχει γράψει bio ακόμα.', 'No bio yet.')}</p>
                <div className="flex flex-wrap gap-2 text-xs font-bold text-ink">
                  {subject.city && <span className="rounded-full border border-border px-2.5 py-1">{subject.city}</span>}
                  {subject.ageRange && <span className="rounded-full border border-border px-2.5 py-1">{subject.ageRange}</span>}
                  {subject.badges.map((b) => (
                    <span key={b} className="rounded-full border border-border px-2.5 py-1">{b}</span>
                  ))}
                </div>
              </div>
            ) : (
              <LockedSection name={subject.name} what={t('Σχετικά', 'About')} />
            )}
            {can('interests') ? (
              <div className="space-y-2">
                <h2 className={cn(APP_TYPO.sectionLabel, 'text-ink-muted')}>{t('Ενδιαφέροντα', 'Interests')}</h2>
                {(subject.interests ?? []).length === 0 ? (
                  <p className="text-sm font-medium text-ink-muted">{t('Δεν έχει προσθέσει ενδιαφέροντα.', 'No interests added.')}</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {subject.interests.map((i) => {
                      const shared = sharedInterests.includes(i);
                      return (
                        <li key={i} className={cn('rounded-full border px-2.5 py-1 text-xs font-bold', shared ? 'border-accent bg-accent-soft text-ink' : 'border-border text-ink')}>
                          {interestLabel(i, language)}
                          {shared && <span className="sr-only"> {t('(κοινό)', '(shared)')}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <LockedSection name={subject.name} what={t('Ενδιαφέροντα', 'Interests')} />
            )}
          </Card>
        )}

        {activeTab === 'nakamas' &&
          (can('connections') ? (
            <Card className="p-4">
              <h2 className={cn(APP_TYPO.sectionLabel, 'mb-3 text-ink-muted')}>
                {t(`Nakamas (${theirConnections.length})`, `Nakamas (${theirConnections.length})`)}
              </h2>
              {theirConnections.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink-muted">{t('Καμία σύνδεση ακόμα.', 'No connections yet.')}</p>
                  {isSelf && (
                    <Button size="sm" variant="ghost" onClick={() => navigate('/buddy-seek')}>
                      {t('Βρες Nakamas', 'Find Nakamas')}
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {theirConnections.map((u) => (
                    <li key={u.id}>
                      <Link to={profilePathFor(u)} className="flex min-h-12 items-center gap-2 rounded-xl border border-border p-2 hover:border-border-strong">
                        <PersonAvatar user={u} size="sm" viewer={viewer} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-ink">{u.id === me.id ? t('Εσύ', 'You') : u.name}</span>
                          {mutualIds.includes(u.id) && <span className="block text-2xs font-bold text-ink-muted">{t('Κοινός Nakama', 'Mutual')}</span>}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <LockedSection name={subject.name} what={t('Λίστα Nakamas', 'Nakamas list')} />
          ))}

        {activeTab === 'events' &&
          (can('events') ? (
            <Card className="p-4">
              <h2 className={cn(APP_TYPO.sectionLabel, 'mb-3 text-ink-muted')}>{t('Εκδηλώσεις', 'Events')}</h2>
              {theirEvents.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-ink-muted">{t('Καμία εκδήλωση ακόμα.', 'No events yet.')}</p>
                  {isSelf && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => navigate('/')}>
                        {t('Εξερεύνηση', 'Explore')}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate('/buddy-seek')}>
                        {t('Βρες Nakamas', 'Find Nakamas')}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {theirEvents.map((e) => (
                    <li key={e.id}>
                      <Link to={`/events/${e.id}`} className="flex min-h-12 items-center gap-3 rounded-xl border border-border p-2 hover:border-border-strong">
                        <CalendarDays className="h-4 w-4 shrink-0 text-ink" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{e.title}</span>
                          <span className="block truncate text-xs font-medium text-ink-muted">{e.date} · {e.locationArea}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <LockedSection name={subject.name} what={t('Εκδηλώσεις', 'Events')} />
          ))}
      </div>

      <BlockModal open={blockOpen} name={subject.name} onClose={() => setBlockOpen(false)} onConfirm={handleBlock} />
    </div>
  );
}

function BlockModal({ open, name, onClose, onConfirm }: { open: boolean; name: string; onClose: () => void; onConfirm: () => void }) {
  const { t } = useLanguage();
  return (
    <Modal open={open} onClose={onClose} title={t(`Αποκλεισμός ${name};`, `Block ${name}?`)} size="sm">
      <ul className="mb-4 list-disc space-y-1 pl-5 text-sm font-medium text-ink-muted">
        <li>{t('Δεν θα βλέπετε ο ένας το προφίλ και τις δημοσιεύσεις του άλλου.', 'You will not see each other’s profile or posts.')}</li>
        <li>{t('Δεν θα μπορείτε να στείλετε μηνύματα.', 'You will not be able to message each other.')}</li>
        <li>{t('Η σύνδεσή σας αφαιρείται. Δεν ειδοποιείται.', 'Your connection is removed. They are not notified.')}</li>
      </ul>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>{t('Ακύρωση', 'Cancel')}</Button>
        <Button size="sm" variant="danger" onClick={onConfirm}>{t('Αποκλεισμός', 'Block')}</Button>
      </div>
    </Modal>
  );
}
