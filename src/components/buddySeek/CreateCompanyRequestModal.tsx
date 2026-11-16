import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { audienceSummary, exposureSummary } from '../../lib/companyRequestUtils';
import { CompanyRequestCard } from './CompanyRequestCard';
import { cn } from '../../lib/utils';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import type { Event } from '../../types';
import type {
  CompanyRequest,
  LookingForType,
  MeetingPreference,
  ProfileExposure,
  VisibilityMode,
} from '../../types/companyRequest';

const STEPS = 5;

export function CreateCompanyRequestModal({
  event,
  open,
  onClose,
  darkSurface,
  existingRequest,
}: {
  event: Event;
  open: boolean;
  onClose: () => void;
  darkSurface?: boolean;
  /** When set, modal edits this request instead of creating a new one. */
  existingRequest?: CompanyRequest | null;
}) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlayBehavior(open, onClose, panelRef);

  const currentUser = useStore((s) => s.currentUser);
  const prefs = useStore((s) => s.companyRequestPreferences);
  const publish = useStore((s) => s.publishCompanyRequest);
  const saveDraft = useStore((s) => s.saveCompanyRequestDraft);
  const updateRequest = useStore((s) => s.updateCompanyRequest);

  const isEdit = Boolean(existingRequest);

  const [step, setStep] = useState(0);
  const [lookingForType, setLookingForType] = useState<LookingForType>('open_to_suggestions');
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>(prefs.defaultVisibility);
  const [profileExposure, setProfileExposure] = useState<ProfileExposure>(prefs.defaultProfileExposure);
  const [preferredGroupMin, setPreferredGroupMin] = useState(3);
  const [preferredGroupMax, setPreferredGroupMax] = useState(6);
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [meetingPreference, setMeetingPreference] = useState<MeetingPreference>('chat_first');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep(0);
    if (existingRequest) {
      setLookingForType(existingRequest.lookingForType);
      setVisibilityMode(existingRequest.visibilityMode);
      setProfileExposure(existingRequest.profileExposure);
      setPreferredGroupMin(existingRequest.preferredGroupMin);
      setPreferredGroupMax(existingRequest.preferredGroupMax);
      setFlexibleDates(existingRequest.flexibleDates);
      setMeetingPreference(existingRequest.meetingPreference);
      setMessage(existingRequest.message ?? '');
    } else {
      setLookingForType('open_to_suggestions');
      setVisibilityMode(prefs.defaultVisibility);
      setProfileExposure(prefs.defaultProfileExposure);
      setPreferredGroupMin(3);
      setPreferredGroupMax(6);
      setFlexibleDates(true);
      setMeetingPreference('chat_first');
      setMessage('');
    }
  }, [open, existingRequest?.id, prefs.defaultVisibility, prefs.defaultProfileExposure]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !currentUser) return null;

  const previewRequest: CompanyRequest = {
    id: existingRequest?.id ?? 'preview',
    eventId: event.id,
    creatorUserId: currentUser.id,
    lookingForType,
    message,
    preferredGroupMin,
    preferredGroupMax,
    flexibleDates,
    meetingPreference,
    visibilityMode,
    profileExposure,
    requiredTrustTier: existingRequest?.requiredTrustTier ?? 'none',
    status: existingRequest?.status ?? 'active',
    createdAt: existingRequest?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const payload = {
    lookingForType,
    message: message || undefined,
    preferredGroupMin,
    preferredGroupMax,
    flexibleDates,
    meetingPreference,
    visibilityMode,
    profileExposure,
    requiredTrustTier: 'none' as const,
  };

  const publishNow = () => {
    if (existingRequest) {
      updateRequest(existingRequest.id, {
        ...payload,
        status: existingRequest.status === 'draft' || existingRequest.status === 'paused'
          ? 'active'
          : existingRequest.status,
        updatedAt: new Date().toISOString(),
      });
      toast.success(t('Το αίτημα ενημερώθηκε', 'Request updated'));
    } else {
      publish({
        eventId: event.id,
        creatorUserId: currentUser.id,
        ...payload,
        status: 'active',
      });
      toast.success(t('Το αίτημα δημοσιεύτηκε', 'Request published'));
    }
    onClose();
    setStep(0);
  };

  const saveAsDraft = () => {
    if (existingRequest) {
      updateRequest(existingRequest.id, {
        ...payload,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      });
      toast.message(t('Αποθηκεύτηκε ως πρόχειρο', 'Saved as draft'));
    } else {
      saveDraft({
        eventId: event.id,
        creatorUserId: currentUser.id,
        ...payload,
      });
      toast.message(t('Αποθηκεύτηκε ως πρόχειρο', 'Saved as draft'));
    }
    onClose();
  };

  const shell = darkSurface ? 'bg-gray-900 border-gray-700 text-white' : 'bg-surface-raised border-border text-ink';

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? t('Επεξεργασία αιτήματος', 'Edit request') : t('Ψάχνετε Nakamas;', 'Looking for Nakamas?')}
    >
      <button type="button" tabIndex={-1} className="absolute inset-0 bg-black/50" onClick={onClose} aria-label={t('Κλείσιμο', 'Close')} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn('relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border shadow-soft-lg max-h-[92vh] flex flex-col outline-none', shell)}
      >
        <div className="p-4 border-b border-inherit shrink-0">
          <h2 className="text-sm md:text-base font-bold">
            {isEdit
              ? t('Επεξεργασία αιτήματος', 'Edit request')
              : t('Ψάχνετε Nakamas;', 'Looking for Nakamas?')}
          </h2>
          <p className="text-xs opacity-70 mt-0.5">
            {t('Βήμα', 'Step')} {step + 1}/{STEPS} · {event.title}
          </p>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: STEPS }).map((_, i) => (
              <div key={i} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-border')} />
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {step === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold">{t('Τι ψάχνετε;', 'What are you looking for?')}</p>
              {(
                [
                  ['join_group', 'Ένταξη σε υπάρχουσα ομάδα', 'Join an existing group'],
                  ['find_people', '1–2 άτομα', 'Find 1–2 people'],
                  ['create_group', 'Δημιουργία μικρής ομάδας', 'Create a small group'],
                  ['group_merge', 'Συντονισμός ομάδων', 'Coordinate groups'],
                  ['open_to_suggestions', 'Ανοιχτός/ή σε προτάσεις', 'Open to suggestions'],
                ] as const
              ).map(([val, el, en]) => (
                <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="lft" checked={lookingForType === val} onChange={() => setLookingForType(val)} />
                  {t(el, en)}
                </label>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm font-bold">{t('Ποιος μπορεί να το δει;', 'Who can see this?')}</p>
              {(
                [
                  'private',
                  'similar_interests',
                  'same_event_viewers',
                  'verified_users',
                  'public_event_page',
                ] as VisibilityMode[]
              ).map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="vis" checked={visibilityMode === mode} onChange={() => setVisibilityMode(mode)} />
                  {audienceSummary(mode, t)}
                </label>
              ))}
              <p className="text-xs opacity-60 flex items-center gap-1">
                <Shield className="w-3 h-3" aria-hidden />
                {t('Το αίτημά σας δεν είναι δημόσιο από προεπιλογή.', 'Your request is not public by default.')}
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <p className="text-sm font-bold">{t('Τι θα εμφανίζεται;', 'What will be shown?')}</p>
              {(
                ['anonymous', 'nickname', 'interests_only', 'trust_badges', 'optional_photo', 'mini_profile'] as ProfileExposure[]
              ).map((ex) => (
                <label key={ex} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="exp" checked={profileExposure === ex} onChange={() => setProfileExposure(ex)} />
                  {exposureSummary(ex, t)}
                </label>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-bold">{t('Μέγεθος & διαθεσιμότητα', 'Size & availability')}</p>
              <div className="flex gap-3">
                <label className="text-xs font-semibold">
                  {t('Ελάχ.', 'Min')}
                  <input
                    type="number"
                    min={1}
                    value={preferredGroupMin}
                    onChange={(e) => setPreferredGroupMin(Number(e.target.value))}
                    className="block w-12 mt-1 rounded-lg border border-border px-2 py-1 text-sm bg-surface-raised"
                    aria-label={t('Ελάχιστο μέγεθος ομάδας', 'Minimum group size')}
                  />
                </label>
                <label className="text-xs font-semibold">
                  {t('Μέγ.', 'Max')}
                  <input
                    type="number"
                    min={2}
                    value={preferredGroupMax}
                    onChange={(e) => setPreferredGroupMax(Number(e.target.value))}
                    className="block w-12 mt-1 rounded-lg border border-border px-2 py-1 text-sm bg-surface-raised"
                    aria-label={t('Μέγιστο μέγεθος ομάδας', 'Maximum group size')}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={flexibleDates} onChange={(e) => setFlexibleDates(e.target.checked)} />
                {t('Ευέλικτες ημερομηνίες', 'Flexible dates')}
              </label>
              <select aria-label={t("Σημείο συνάντησης", "Meeting preference")}
                value={meetingPreference}
                onChange={(e) => setMeetingPreference(e.target.value as MeetingPreference)}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm bg-surface-raised"
              >
                <option value="at_venue">{t('Στον χώρο', 'At venue')}</option>
                <option value="coffee_before">{t('Καφές πριν', 'Coffee before')}</option>
                <option value="walk_after">{t('Περπάτημα μετά', 'Walk after')}</option>
                <option value="chat_first">{t('Chat πρώτα', 'Group chat first')}</option>
              </select>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('Προαιρετικό μήνυμα…', 'Optional message…')}
                className="w-full rounded-xl border border-border px-3 py-2 text-sm min-h-[72px] bg-surface-raised"
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm font-bold">
                {isEdit
                  ? t('Έλεγχος πριν την αποθήκευση', 'Review before saving')
                  : t('Έλεγχος πριν τη δημοσίευση', 'Review before publishing')}
              </p>
              <ul className="text-xs space-y-1 opacity-80">
                <li>
                  {t('Ορατό σε', 'Visible to')}: {audienceSummary(visibilityMode, t)}
                </li>
                <li>
                  {t('Εμφανίζονται', 'Shown')}: {exposureSummary(profileExposure, t)}
                </li>
                <li>{t('Μπορείτε να επεξεργαστείτε, να παύσετε ή να διαγράψετε ανά πάσα στιγμή.', 'You can edit, pause, or delete anytime.')}</li>
              </ul>
              <CompanyRequestCard
                request={previewRequest}
                seeker={currentUser}
                event={event}
                darkSurface={darkSurface}
                onAskToJoin={() => {}}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-inherit flex gap-2 shrink-0">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="min-h-11 px-4 rounded-2xl border border-border text-xs font-bold flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden /> {t('Πίσω', 'Back')}
            </button>
          )}
          {step < STEPS - 1 ? (
            <button
              type="button"
              data-autofocus
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 min-h-11 rounded-2xl bg-accent hover:bg-accent-strong text-accent-fg text-xs font-bold flex items-center justify-center gap-1"
            >
              {t('Συνέχεια', 'Continue')} <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          ) : (
            <>
              <button type="button" onClick={saveAsDraft} className="min-h-11 px-3 rounded-2xl border border-border text-xs font-bold">
                {t('Πρόχειρο', 'Draft')}
              </button>
              <button
                type="button"
                data-autofocus
                onClick={publishNow}
                className="flex-1 min-h-11 rounded-2xl bg-accent hover:bg-accent-strong text-accent-fg text-xs font-bold"
              >
                {isEdit
                  ? t('Αποθήκευση αλλαγών', 'Save changes')
                  : t('Δημοσίευση αιτήματος', 'Publish request')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
