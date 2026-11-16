import { useMemo, useState } from 'react';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { LIST_NAME_MAX_CHARS, useWallAccess, useWallStore } from '../../store/wallStore';
import { connectionIdsOf } from '../../lib/audience';
import { cn } from '../../lib/utils';
import { PeopleChecklist } from './AudiencePickerModal';

/**
 * Custom audience lists («Κοντινοί φίλοι», «Ομάδα τρεξίματος»…). Members are
 * always connections; deleting a list keeps every post visible to the same
 * people by turning it into «Συγκεκριμένα άτομα».
 */
export function AudienceListsManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const allLists = useWallStore((s) => s.lists);
  const { createList, updateList, deleteList } = useWallStore.getState();
  const access = useWallAccess();
  const myId = me?.id ?? '';
  const lists = useMemo(() => allLists.filter((l) => l.ownerId === myId), [allLists, myId]);
  const connections = useMemo(() => (myId ? connectionIdsOf(access.graph, myId) : []), [access.graph, myId]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = lists.find((l) => l.id === selectedId) ?? lists[0];

  const create = () => {
    const res = createList(newName, []);
    if (!res.ok) {
      toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
      return;
    }
    setNewName('');
    setSelectedId(res.id ?? null);
    toast.success(t('Η λίστα δημιουργήθηκε', 'List created'));
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Οι λίστες κοινού μου', 'My audience lists')} size="lg">
      <p className="-mt-2 mb-3 text-sm font-medium text-ink-muted">
        {t('Μοιράσου με ομάδες ανθρώπων με ένα κλικ. Μόνο εσύ βλέπεις τις λίστες σου.', 'Share with groups of people in one tap. Only you see your lists.')}
      </p>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('Λίστες', 'Lists')}>
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={selected?.id === l.id}
            onClick={() => {
              setSelectedId(l.id);
              setConfirmDelete(false);
            }}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold',
              selected?.id === l.id ? 'border-accent bg-accent-soft text-ink' : 'border-border text-ink-muted hover:text-ink',
            )}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden /> {l.name}
            <span className="tabular-nums opacity-70">{l.memberIds.length}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              create();
            }
          }}
          maxLength={LIST_NAME_MAX_CHARS}
          placeholder={t('Νέα λίστα, π.χ. «Ομάδα τρεξίματος»', 'New list, e.g. “Running crew”')}
          aria-label={t('Όνομα νέας λίστας', 'New list name')}
          className="min-h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-accent"
        />
        <Button size="sm" onClick={create} disabled={!newName.trim()} className="gap-1">
          <Plus className="h-3.5 w-3.5" aria-hidden /> {t('Δημιουργία', 'Create')}
        </Button>
      </div>

      {selected ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-border p-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-muted">{t('Όνομα', 'Name')}</span>
            <input
              key={selected.id}
              defaultValue={selected.name}
              maxLength={LIST_NAME_MAX_CHARS}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== selected.name) {
                  const res = updateList(selected.id, { name: v });
                  if (res.ok) toast.success(t('Το όνομα αποθηκεύτηκε', 'Name saved'));
                  else toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
                }
              }}
              className="min-h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm font-bold text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div>
            <span className="mb-1 block text-xs font-bold text-ink-muted">{t('Μέλη (από τους Nakamas σου)', 'Members (from your Nakamas)')}</span>
            <PeopleChecklist
              candidateIds={connections}
              selected={selected.memberIds}
              onChange={(ids) => updateList(selected.id, { memberIds: ids })}
              label={t('Μέλη λίστας', 'List members')}
              emptyText={t('Σύνδεσου πρώτα με άτομα για να τα προσθέσεις.', 'Connect with people first to add them.')}
            />
          </div>
          {confirmDelete ? (
            <div className="rounded-xl bg-surface p-3">
              <p className="text-xs font-medium text-ink">
                {t(
                  'Οι δημοσιεύσεις που χρησιμοποιούν τη λίστα θα συνεχίσουν να φαίνονται στα ίδια άτομα (ως «Συγκεκριμένα άτομα»).',
                  'Posts that use this list stay visible to the same people (as “Specific people”).',
                )}
              </p>
              <div className="mt-2 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  {t('Άκυρο', 'Cancel')}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    deleteList(selected.id);
                    setConfirmDelete(false);
                    setSelectedId(null);
                    toast.success(t('Η λίστα διαγράφηκε', 'List deleted'));
                  }}
                >
                  {t('Διαγραφή λίστας', 'Delete list')}
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> {t('Διαγραφή λίστας', 'Delete list')}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border px-3 py-4 text-sm font-medium text-ink-muted">
          {t('Δεν έχεις λίστες ακόμα. Δημιούργησε την πρώτη παραπάνω.', 'No lists yet. Create your first one above.')}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button size="sm" onClick={onClose}>
          {t('Τέλος', 'Done')}
        </Button>
      </div>
    </Modal>
  );
}
