import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { audienceSummary, exposureSummary } from '../../lib/companyRequestUtils';
import type { ProfileExposure, VisibilityMode, PhotoRevealPolicy, InterestVisibilityMode } from '../../types/companyRequest';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { AppSelect } from '../common/AppSelect';

export function BuddySeekPrivacySettings() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const prefs = useStore((s) => s.companyRequestPreferences);
  const setPrefsStore = useStore((s) => s.setCompanyRequestPreferences);
  const setPrefs = (patch: Parameters<typeof setPrefsStore>[0]) => {
    setPrefsStore(patch);
    toast.success(t('Οι ρυθμίσεις απορρήτου αποθηκεύτηκαν', 'Privacy settings saved'));
  };

  const inputClass = cn(
    'w-full rounded-2xl border px-3 py-2 text-sm font-medium outline-none focus:ring-2',
    a.inputBg,
    a.ring,
  );

  return (
    <div className={cn('rounded-2xl border p-4 space-y-4', a.cardSurface, a.borderB)}>
      <div>
        <h3 className={cn('text-sm font-bold', a.head)}>
          {t('Αναζήτηση Nakamas — απόρρητο', 'Looking for Nakamas — privacy')}
        </h3>
        <p className={cn('text-sm mt-1 leading-relaxed', a.sub)}>
          {t(
            'Λεπτομερείς ρυθμίσεις κοινοποίησης · ορατότητα με σεβασμό στο απόρρητο. Δεν αποτελεί νομική συμβουλή.',
            'Granular sharing settings · privacy-first visibility. Not legal advice.',
          )}
        </p>
      </div>

      <div>
        <label htmlFor="bs-visibility" className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Προεπιλεγμένη ορατότητα αιτήματος', 'Default request visibility')}
        </label>
        <AppSelect
          id="bs-visibility"
          ariaLabel={t('Προεπιλεγμένη ορατότητα αιτήματος', 'Default request visibility')}
          value={prefs.defaultVisibility}
          onValueChange={(v) => setPrefs({ defaultVisibility: v as VisibilityMode })}
          className={inputClass}
          options={(
            ['private', 'similar_interests', 'same_event_viewers', 'verified_users', 'public_event_page'] as VisibilityMode[]
          ).map((mode) => ({ value: mode, label: audienceSummary(mode, t) }))}
        />
      </div>

      <div>
        <label htmlFor="bs-exposure" className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Προεπιλεγμένη έκθεση προφίλ', 'Default profile exposure')}
        </label>
        <AppSelect
          id="bs-exposure"
          ariaLabel={t('Προεπιλεγμένη έκθεση προφίλ', 'Default profile exposure')}
          value={prefs.defaultProfileExposure}
          onValueChange={(v) => setPrefs({ defaultProfileExposure: v as ProfileExposure })}
          className={inputClass}
          options={(
            ['anonymous', 'nickname', 'interests_only', 'trust_badges', 'optional_photo', 'mini_profile'] as ProfileExposure[]
          ).map((ex) => ({ value: ex, label: exposureSummary(ex, t) }))}
        />
      </div>

      <div>
        <label htmlFor="bs-photo" className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Φωτογραφία', 'Photo')}
        </label>
        <AppSelect
          id="bs-photo"
          ariaLabel={t('Φωτογραφία', 'Photo')}
          value={prefs.photoRevealPolicy}
          onValueChange={(v) => setPrefs({ photoRevealPolicy: v as PhotoRevealPolicy })}
          className={inputClass}
          options={[
            { value: 'never', label: t('Ποτέ σε κάρτες', 'Never in cards') },
            { value: 'after_accept', label: t('Μετά την αποδοχή', 'After accept') },
            { value: 'confirmed_group_only', label: t('Μόνο σε επιβεβαιωμένη ομάδα', 'Confirmed group only') },
            { value: 'in_cards_opt_in', label: t('Μόνο με ρητή επιλογή', 'Explicit opt-in only') },
          ]}
        />
      </div>

      <div>
        <label htmlFor="bs-interests" className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Ενδιαφέροντα', 'Interests')}
        </label>
        <AppSelect
          id="bs-interests"
          ariaLabel={t('Ενδιαφέροντα', 'Interests')}
          value={prefs.interestVisibility}
          onValueChange={(v) => setPrefs({ interestVisibility: v as InterestVisibilityMode })}
          className={inputClass}
          options={[
            { value: 'shared_only', label: t('Μόνο κοινά', 'Shared only') },
            { value: 'count_only', label: t('Μόνο αριθμός', 'Count only') },
            { value: 'all', label: t('Όλα τα επιλεγμένα', 'All selected') },
            { value: 'hidden', label: t('Απόκρυψη', 'Hidden') },
          ]}
        />
      </div>

      {(
        [
          ['allowSimilarInterestRecommendations', 'Προτάσεις από κοινά ενδιαφέροντα', 'Similar-interest suggestions'],
          ['allowSameEventSuggestions', 'Προτάσεις ίδιας εκδήλωσης', 'Same-event suggestions'],
          ['allowGroupInvites', 'Προσκλήσεις σε ομάδα', 'Group invites'],
          ['allowGroupMergeSuggestions', 'Προτάσεις συγχώνευσης ομάδων', 'Group merge suggestions'],
          ['showInterestsInDiscovery', 'Εμφάνιση ενδιαφερόντων στην ανακάλυψη', 'Show interests in discovery'],
        ] as const
      ).map(([key, el, en]) => (
        <label key={key} className={cn('flex items-center gap-2 text-sm font-medium cursor-pointer', a.head)}>
          <input
            type="checkbox"
            checked={prefs[key]}
            onChange={(e) => setPrefs({ [key]: e.target.checked })}
          />
          {t(el, en)}
        </label>
      ))}

      <p className={cn('text-xs leading-relaxed', a.sub)}>
        {t(
          'Η φωτογραφία είναι προαιρετική και δεν εμφανίζεται από προεπιλογή. Μπορείτε να παύσετε ή να διαγράψετε αιτήματα ανά πάσα στιγμή.',
          'Your photo is optional and never shown by default. You can pause or delete requests anytime.',
        )}
      </p>
    </div>
  );
}
