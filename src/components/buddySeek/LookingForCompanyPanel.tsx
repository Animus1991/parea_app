import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Pause, Trash2, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useMyBuddySeekForEvent, useCompanyRequestsForEvent } from '../../hooks/useBuddySeekDiscovery';
import { buildBuddySeekSuggestions } from '../../lib/buddySeekMatching';
import { audienceSummary } from '../../lib/companyRequestUtils';
import { getEventDetailSurfaceTokens } from '../../lib/eventDetailDesignTokens';
import { cn } from '../../lib/utils';
import { CompanyRequestCard } from './CompanyRequestCard';
import { CreateCompanyRequestModal } from './CreateCompanyRequestModal';
import { JoinRequestPreviewModal } from './JoinRequestPreviewModal';
import { GroupMergeModal } from './GroupMergeModal';
import type { Group } from '../../types';
import type { Event } from '../../types';
import type { EventDetailGroupAccent } from '../events/EventDetailGroupCard';

type Tab = 'requests' | 'groups';

export function LookingForCompanyPanel({
  event,
  accent = 'classic',
  darkSurface = false,
}: {
  event: Event;
  accent?: EventDetailGroupAccent;
  darkSurface?: boolean;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tok = getEventDetailSurfaceTokens(accent, darkSurface);
  const currentUser = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const companyRequests = useStore((s) => s.companyRequests);
  const companyJoinRequests = useStore((s) => s.companyJoinRequests);
  const sendJoin = useStore((s) => s.sendCompanyJoinRequest);
  const acceptJoin = useStore((s) => s.acceptCompanyJoinRequest);
  const declineJoin = useStore((s) => s.declineCompanyJoinRequest);
  const pauseRequest = useStore((s) => s.pauseCompanyRequest);
  const deleteRequest = useStore((s) => s.deleteCompanyRequest);
  const reportRequest = useStore((s) => s.reportCompanyRequest);
  const setGroupRecruiting = useStore((s) => s.setGroupRecruiting);

  const myRequest = useMyBuddySeekForEvent(event.id);
  const visibleRequests = useCompanyRequestsForEvent(event.id);
  const suggestions = buildBuddySeekSuggestions(currentUser, event, companyRequests, groups, users);
  const eventGroups = groups.filter((g) => g.eventId === event.id && g.status !== 'cancelled');

  const [tab, setTab] = useState<Tab>('requests');
  const [expanded, setExpanded] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [preview, setPreview] = useState<{
    seekerId: string;
    requestId: string;
    mode: 'send' | 'owner_review';
    joinId?: string;
  } | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState<'spots' | 'verified' | null>(null);
  const [mergePair, setMergePair] = useState<{ from: Group; to: Group } | null>(null);

  if (!currentUser) return null;

  const myGroups = eventGroups.filter((g) => g.members.includes(currentUser.id));
  const canRecruit = myGroups.some((g) => g.hostId === currentUser.id || g.members[0] === currentUser.id);
  const pendingForMe = companyJoinRequests.filter(
    (j) => j.status === 'pending' && j.targetUserId === currentUser.id,
  );

  const filteredRequests = visibleRequests.filter(({ intent }) => {
    if (hiddenIds.includes(intent.id)) return false;
    if (filterOpen === 'spots' && intent.lookingForType === 'join_group') return true;
    if (filterOpen === 'verified' && intent.requiredTrustTier !== 'none') return true;
    if (!filterOpen) return true;
    return true;
  });

  const previewSeeker = preview ? users.find((u) => u.id === preview.seekerId) : null;

  return (
    <section className={cn(tok.card, 'space-y-4')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className={tok.sectionHeading}>
            <Users className="w-4 h-4 inline mr-1.5 opacity-80" />
            {t('Looking for company', 'Looking for company')}
          </h2>
          <p className={cn(tok.muted, 'text-[11px] mt-1 leading-relaxed')}>
            {t(
              'Εκδήλωση πρώτα · πρόθεση δεύτερη · ελέγχετε την ορατότητα.',
              'Event first · intention second · you control visibility.',
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn('p-2 rounded-xl', darkSurface ? 'hover:bg-white/10' : 'hover:bg-gray-100')}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <>
          <div className="flex gap-1 p-1 rounded-xl bg-black/5 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setTab('requests')}
              className={cn(
                'flex-1 py-2 rounded-lg text-[11px] font-bold',
                tab === 'requests' ? 'bg-cyan-600 text-white' : tok.muted,
              )}
            >
              {t('Άτομα & αιτήματα', 'People & requests')}
            </button>
            <button
              type="button"
              onClick={() => setTab('groups')}
              className={cn(
                'flex-1 py-2 rounded-lg text-[11px] font-bold',
                tab === 'groups' ? 'bg-cyan-600 text-white' : tok.muted,
              )}
            >
              {t('Ομάδες', 'Groups')} ({eventGroups.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 min-h-10 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              {myRequest ? t('Επεξεργασία αιτήματος', 'Edit request') : t('Δημιουργία αιτήματος', 'Create request')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/buddy-seek')}
              className={cn(
                'min-h-10 px-3 rounded-2xl text-[11px] font-bold border',
                darkSurface ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-700',
              )}
            >
              {t('Όλα τα σχέδια', 'All plans')}
            </button>
          </div>

          {myRequest && (
            <div className={cn(tok.innerCard, darkSurface ? 'border-gray-600' : 'border-cyan-100')}>
              <p className={cn('text-[12px] font-bold', darkSurface ? 'text-white' : 'text-gray-900')}>
                {t('Το αίτημά σας', 'Your request')} · {myRequest.status}
              </p>
              <p className={cn('text-[11px] mt-1', tok.muted)}>
                {audienceSummary(myRequest.visibilityMode, t)}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    pauseRequest(myRequest.id);
                    toast.message(t('Σε παύση', 'Paused'));
                  }}
                  className="text-[10px] font-bold flex items-center gap-1 opacity-70"
                >
                  <Pause className="w-3 h-3" /> {t('Παύση', 'Pause')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteRequest(myRequest.id);
                    toast.message(t('Διαγράφηκε', 'Deleted'));
                  }}
                  className="text-[10px] font-bold flex items-center gap-1 text-red-500"
                >
                  <Trash2 className="w-3 h-3" /> {t('Διαγραφή', 'Delete')}
                </button>
              </div>
            </div>
          )}

          {pendingForMe.length > 0 && (
            <div className={cn('rounded-2xl border p-3', darkSurface ? 'border-amber-800 bg-amber-950/20' : 'border-amber-200 bg-amber-50')}>
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                {t(`${pendingForMe.length} αιτήματα συμμετοχής`, `${pendingForMe.length} join requests`)}
              </p>
              {pendingForMe.map((j) => {
                const from = users.find((u) => u.id === j.fromUserId);
                if (!from) return null;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() =>
                      setPreview({ seekerId: from.id, requestId: j.companyRequestId, mode: 'owner_review', joinId: j.id })
                    }
                    className="mt-2 w-full text-left text-[11px] font-medium underline"
                  >
                    {t('Έλεγχος από', 'Review from')} {from.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'requests' && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterOpen(filterOpen === 'spots' ? null : 'spots')}
                  className={cn('text-[10px] font-bold px-2 py-1 rounded-lg border', filterOpen === 'spots' && 'bg-cyan-600 text-white border-cyan-600')}
                >
                  {t('Ανοιχτές θέσεις', 'Open spots')}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(filterOpen === 'verified' ? null : 'verified')}
                  className={cn('text-[10px] font-bold px-2 py-1 rounded-lg border', filterOpen === 'verified' && 'bg-cyan-600 text-white border-cyan-600')}
                >
                  {t('Επαληθευμένοι', 'Verified only')}
                </button>
              </div>

              {filteredRequests.length === 0 ? (
                <p className={cn('text-[12px]', tok.muted)}>
                  {t('Κανείς άλλος δεν εμφανίζεται με τις τρέχουσες ρυθμίσεις ορατότητας.', 'No one else visible with current visibility rules.')}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map(({ intent, seeker }) => (
                    <CompanyRequestCard
                      key={intent.id}
                      request={intent}
                      seeker={seeker}
                      event={event}
                      darkSurface={darkSurface}
                      onAskToJoin={() =>
                        setPreview({ seekerId: seeker.id, requestId: intent.id, mode: 'send' })
                      }
                      onHide={() => setHiddenIds((ids) => [...ids, intent.id])}
                      onReport={() => {
                        reportRequest(intent.id, 'other');
                        toast.message(t('Αναφέρθηκε', 'Reported'));
                      }}
                    />
                  ))}
                </div>
              )}

              {suggestions.length > 0 && (
                <div>
                  <p className={cn('text-[11px] font-bold mb-2', tok.sectionHeading)}>
                    {t('Συμβατές προτάσεις', 'Compatible suggestions')}
                  </p>
                  <ul className="space-y-2">
                    {suggestions.slice(0, 4).map((s) => (
                      <li
                        key={`${s.kind}-${s.groupId ?? s.seekerIntentId}`}
                        className={cn('text-[11px] rounded-xl border p-2.5', darkSurface ? 'border-gray-700' : 'border-gray-100')}
                      >
                        {t(s.labelEl, s.labelEn)}
                        {s.groupId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/events/${event.id}/join?group=${s.groupId}`)}
                            className="ml-2 text-cyan-600 font-bold"
                          >
                            {t('Συμμετοχή', 'Join')}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {tab === 'groups' && (
            <div className="space-y-2">
              {eventGroups.length === 0 ? (
                <p className={cn('text-[12px]', tok.muted)}>{t('Δεν υπάρχουν ομάδες ακόμα.', 'No groups yet.')}</p>
              ) : (
                eventGroups.map((g) => {
                  const spots = g.targetSize - g.members.length;
                  return (
                    <div
                      key={g.id}
                      className={cn('rounded-xl border p-3 flex justify-between items-center', darkSurface ? 'border-gray-700' : 'border-gray-100')}
                    >
                      <div>
                        <p className={cn('text-[12px] font-bold', darkSurface ? 'text-white' : 'text-gray-900')}>
                          {g.isRecruiting ? t('Ομάδα σε σχηματισμό', 'Group forming') : t('Ομάδα', 'Group')}
                        </p>
                        <p className={cn('text-[10px]', tok.muted)}>
                          {g.members.length}/{g.targetSize} · {spots} {t('θέσεις', 'spots')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {!g.members.includes(currentUser.id) && spots > 0 && (
                          <button
                            type="button"
                            onClick={() => navigate(`/events/${event.id}/join?group=${g.id}`)}
                            className="text-[10px] font-bold text-cyan-600"
                          >
                            {t('Αίτημα συμμετοχής', 'Ask to join')}
                          </button>
                        )}
                        {myGroups[0] && myGroups[0].id !== g.id && (
                          <button
                            type="button"
                            onClick={() => setMergePair({ from: myGroups[0], to: g })}
                            className="text-[10px] font-bold text-emerald-600"
                          >
                            {t('Συγχώνευση', 'Suggest merge')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {canRecruit && myGroups[0] && (
                <label className={cn('flex items-center gap-2 text-[11px] mt-2', tok.muted)}>
                  <input
                    type="checkbox"
                    checked={!!myGroups[0].isRecruiting}
                    onChange={(e) => setGroupRecruiting(myGroups[0].id, e.target.checked)}
                  />
                  {t('Η ομάδα μου δέχεται νέα μέλη', 'My group is recruiting')}
                </label>
              )}
            </div>
          )}

          <p className={cn('text-[10px] flex items-start gap-1.5', tok.muted)}>
            <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {t(
              'Σχεδιασμένο με privacy controls. Μόνο τα πεδία που επιλέγετε εμφανίζονται. Δεν είναι διαφήμιση.',
              'Designed with privacy controls. Only selected fields show. Not advertising.',
            )}
          </p>
        </>
      )}

      <CreateCompanyRequestModal event={event} open={createOpen} onClose={() => setCreateOpen(false)} darkSurface={darkSurface} />

      {preview && previewSeeker && (
        <JoinRequestPreviewModal
          open
          onClose={() => setPreview(null)}
          seeker={previewSeeker}
          event={event}
          mode={preview.mode}
          onSendRequest={() => {
            const id = sendJoin(preview.requestId);
            if (id) toast.success(t('Αίτημα εστάλη', 'Request sent'));
            else toast.error(t('Δεν ήταν δυνατή η αποστολή', 'Could not send'));
          }}
          onAccept={() => {
            if (!preview.joinId) return;
            const groupId = acceptJoin(preview.joinId);
            if (groupId) {
              toast.success(t('Αποδεχτήκατε — άνοιγμα συνομιλίας', 'Accepted — opening chat'));
              navigate(`/chat/${groupId}`);
            } else {
              toast.success(t('Αποδεχτήκατε', 'Accepted'));
            }
          }}
        />
      )}

      {mergePair && (
        <GroupMergeModal
          open
          onClose={() => setMergePair(null)}
          fromGroup={mergePair.from}
          toGroup={mergePair.to}
          event={event}
        />
      )}
    </section>
  );
}
