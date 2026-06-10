import { useLanguage } from '../../lib/i18n';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const a = usePageContrast();
  return (
    <label className={cn('flex items-start justify-between gap-3 py-3 border-b cursor-pointer', a.borderB)}>
      <span>
        <span className={cn('text-[13px] font-medium block', a.head)}>{label}</span>
        {hint && <span className={cn('text-[11px] block mt-0.5', a.sub)}>{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1" />
    </label>
  );
}

export function ChatPrivacySettingsPanel() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const privacy = useChatStore((s) => s.privacy);
  const setPrivacy = useChatStore((s) => s.setPrivacy);

  return (
    <section className={cn('rounded-2xl border p-4 mt-6', a.cardSurface, a.borderB)}>
      <h2 className={cn('text-sm font-bold mb-1', a.head)}>{t('Nakamas Chat — ρυθμίσεις', 'Nakamas Chat — settings')}</h2>
      <p className={cn('text-[11px] mb-3', a.sub)}>
        {t(
          'Relationship-based messaging · προσωρινά event chats από προεπιλογή',
          'Relationship-based messaging · temporary event chats by default',
        )}
      </p>
      <Toggle
        label={t('Μηνύματα από αποδεκτές ομάδες', 'Messages from accepted groups')}
        checked={privacy.allowGroupChats}
        onChange={(v) => setPrivacy({ allowGroupChats: v })}
      />
      <Toggle
        label={t('Chats από συγχώνευση ομάδων', 'Chats from group merges')}
        hint={t(
          'Επιτρέπει μηνύματα όταν δύο ομάδες συγχωνεύονται για μια εκδήλωση',
          'Allows messaging when two groups merge for an event',
        )}
        checked={privacy.allowGroupMergeChats}
        onChange={(v) => setPrivacy({ allowGroupMergeChats: v })}
      />
      <Toggle
        label={t('Μηνύματα από αμοιβαίες συνδέσεις', 'Messages from mutual connections')}
        checked={privacy.allowMutualConnectionChats}
        onChange={(v) => setPrivacy({ allowMutualConnectionChats: v })}
      />
      <Toggle
        label={t('Ανακοινώσεις διοργανωτή', 'Organizer messages for confirmed events')}
        checked={privacy.allowOrganizerMessages}
        onChange={(v) => setPrivacy({ allowOrganizerMessages: v })}
      />
      <Toggle
        label={t('Απαιτείται έγκριση για 1:1 chat', 'Require approval before 1:1 chat')}
        checked={privacy.requireApprovalForDirectChat}
        onChange={(v) => setPrivacy({ requireApprovalForDirectChat: v })}
      />
      <Toggle
        label={t('Απόκρυψη προεπισκόπησης', 'Hide message previews')}
        checked={!privacy.showMessagePreviews}
        onChange={(v) => setPrivacy({ showMessagePreviews: !v })}
      />
      <Toggle
        label={t('Αυτόματη λήξη event chats', 'Auto-expire event chats')}
        checked={privacy.autoExpireEventChats}
        onChange={(v) => setPrivacy({ autoExpireEventChats: v })}
      />
    </section>
  );
}
