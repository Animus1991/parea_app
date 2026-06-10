import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { audienceSummary, exposureSummary } from '../../lib/companyRequestUtils';
import type { ProfileExposure, VisibilityMode, PhotoRevealPolicy, InterestVisibilityMode } from '../../types/companyRequest';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export function BuddySeekPrivacySettings() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const prefs = useStore((s) => s.companyRequestPreferences);
  const setPrefs = useStore((s) => s.setCompanyRequestPreferences);

  const inputClass = cn(
    'w-full rounded-2xl border px-3 py-2 text-sm font-medium outline-none focus:ring-2',
    a.inputBg,
    a.ring,
  );

  return (
    <div className={cn('rounded-2xl border p-4 space-y-4', a.cardSurface, a.borderB)}>
      <div>
        <h3 className={cn('text-sm font-bold', a.head)}>
          {t('Looking for company — απόρρητο', 'Looking for company — privacy')}
        </h3>
        <p className={cn('text-sm mt-1 leading-relaxed', a.sub)}>
          {t(
            'Granular sharing settings · privacy-first visibility. Δεν είναι νομική συμβουλή.',
            'Granular sharing settings · privacy-first visibility. Not legal advice.',
          )}
        </p>
      </div>

      <div>
        <label className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Προεπιλεγμένη ορατότητα αιτήματος', 'Default request visibility')}
        </label>
        <select
          value={prefs.defaultVisibility}
          onChange={(e) => setPrefs({ defaultVisibility: e.target.value as VisibilityMode })}
          className={inputClass}
        >
          {(
            ['private', 'similar_interests', 'same_event_viewers', 'verified_users', 'public_event_page'] as VisibilityMode[]
          ).map((mode) => (
            <option key={mode} value={mode}>
              {audienceSummary(mode, t)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Προεπιλεγμένη έκθεση προφίλ', 'Default profile exposure')}
        </label>
        <select
          value={prefs.defaultProfileExposure}
          onChange={(e) => setPrefs({ defaultProfileExposure: e.target.value as ProfileExposure })}
          className={inputClass}
        >
          {(
            ['anonymous', 'nickname', 'interests_only', 'trust_badges', 'optional_photo', 'mini_profile'] as ProfileExposure[]
          ).map((ex) => (
            <option key={ex} value={ex}>
              {exposureSummary(ex, t)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Φωτογραφία', 'Photo')}
        </label>
        <select
          value={prefs.photoRevealPolicy}
          onChange={(e) => setPrefs({ photoRevealPolicy: e.target.value as PhotoRevealPolicy })}
          className={inputClass}
        >
          <option value="never">{t('Ποτέ σε κάρτες', 'Never in cards')}</option>
          <option value="after_accept">{t('Μετά την αποδοχή', 'After accept')}</option>
          <option value="confirmed_group_only">{t('Μόνο σε επιβεβαιωμένη ομάδα', 'Confirmed group only')}</option>
          <option value="in_cards_opt_in">{t('Μόνο με ρητή επιλογή', 'Explicit opt-in only')}</option>
        </select>
      </div>

      <div>
        <label className={cn('text-xs font-bold mb-1 block', a.head)}>
          {t('Ενδιαφέροντα', 'Interests')}
        </label>
        <select
          value={prefs.interestVisibility}
          onChange={(e) => setPrefs({ interestVisibility: e.target.value as InterestVisibilityMode })}
          className={inputClass}
        >
          <option value="shared_only">{t('Μόνο κοινά', 'Shared only')}</option>
          <option value="count_only">{t('Μόνο αριθμός', 'Count only')}</option>
          <option value="all">{t('Όλα τα επιλεγμένα', 'All selected')}</option>
          <option value="hidden">{t('Απόκρυψη', 'Hidden')}</option>
        </select>
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
