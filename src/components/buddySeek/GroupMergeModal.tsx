import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitMerge, Users, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import type { GroupMergeMode } from '../../types/companyRequest';
import type { Event, Group } from '../../types';
import { cn } from '../../lib/utils';

export function GroupMergeModal({
  open,
  onClose,
  fromGroup,
  toGroup,
  event,
}: {
  open: boolean;
  onClose: () => void;
  fromGroup: Group;
  toGroup: Group;
  event: Event;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const suggestMerge = useStore((s) => s.suggestGroupMerge);
  const respondMerge = useStore((s) => s.respondGroupMerge);
  const pending = useStore((s) =>
    s.groupMergeSuggestions.find(
      (m) =>
        m.status === 'pending' &&
        ((m.fromGroupId === fromGroup.id && m.toGroupId === toGroup.id) ||
          (m.fromGroupId === toGroup.id && m.toGroupId === fromGroup.id)),
    ),
  );

  const [mode, setMode] = useState<GroupMergeMode>('coordinate');
  const [message, setMessage] = useState('');

  if (!open) return null;

  const combined = fromGroup.members.length + toGroup.members.length;

  const send = () => {
    const id = suggestMerge(fromGroup.id, toGroup.id, mode, message || undefined);
    toast.success(t('Πρόταση συγχώνευσης εστάλη', 'Merge suggestion sent'));
    onClose();
    void id;
  };

  const acceptPending = () => {
    if (!pending) return;
    const groupId = respondMerge(pending.id, true);
    toast.success(t('Εγινε αποδεκτή η πρόταση', 'Suggestion accepted'));
    onClose();
    if (groupId) navigate(`/chat/${groupId}`);
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
            <GitMerge className="w-5 h-5" />
            <h2 className="text-base font-bold">{t('Πρόταση συγχώνευσης ομάδων', 'Suggest group merge')}</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">{event.title}</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border p-3 dark:border-gray-700">
              <p className="text-xs font-bold uppercase text-gray-500">{t('Η ομάδα σας', 'Your group')}</p>
              <p className="text-lg font-black flex items-center gap-1 mt-1">
                <Users className="w-4 h-4" />
                {fromGroup.members.length}
              </p>
            </div>
            <div className="rounded-2xl border p-3 dark:border-gray-700">
              <p className="text-xs font-bold uppercase text-gray-500">{t('Άλλη ομάδα', 'Other group')}</p>
              <p className="text-lg font-black flex items-center gap-1 mt-1">
                <Users className="w-4 h-4" />
                {toGroup.members.length}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('Συνδυασμένο μέγεθος', 'Combined size')}: ~{combined} · {t('Δεν γίνεται αυτόματα', 'Not automatic')}
          </p>

          {pending ? (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-3">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {t('Εκκρεμής πρόταση', 'Pending suggestion')}
              </p>
              <button
                type="button"
                onClick={acceptPending}
                className="mt-2 w-full min-h-10 rounded-xl bg-emerald-600 text-white text-sm font-bold"
              >
                {t('Αποδοχή (οργανωτής)', 'Accept (organizer)')}
              </button>
            </div>
          ) : (
            <>
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('Τρόπος συντονισμού', 'Coordination mode')}
                </legend>
                {(
                  [
                    ['coordinate', 'Συντονισμός μόνο', 'Coordinate only'],
                    ['merge', 'Συγχώνευση σε μία ομάδα', 'Merge into one group'],
                    ['meet_before', 'Συνάντηση πριν', 'Meet before event'],
                    ['share_chat', 'Προσωρινό chat', 'Temporary shared chat'],
                  ] as const
                ).map(([val, el, en]) => (
                  <label key={val} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="mergeMode" checked={mode === val} onChange={() => setMode(val)} />
                    {t(el, en)}
                  </label>
                ))}
              </fieldset>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('Προαιρετικό μήνυμα…', 'Optional message…')}
                className="w-full rounded-2xl border px-3 py-2 text-sm min-h-[72px] dark:bg-gray-800 dark:border-gray-700"
              />
            </>
          )}

          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            {t('Η άλλη ομάδα πρέπει να αποδεχτεί. Όχι αναγκαστική συγχώνευση.', 'The other group must accept. Never forced.')}
          </p>
        </div>

        <div className="p-5 border-t flex gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-11 rounded-2xl border text-sm font-bold text-gray-700 dark:text-gray-300"
          >
            {t('Ακύρωση', 'Cancel')}
          </button>
          {!pending && (
            <button
              type="button"
              onClick={send}
              className="flex-[2] min-h-11 rounded-2xl bg-cyan-600 text-white text-sm font-bold"
            >
              {t('Αποστολή πρότασης', 'Send suggestion')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
