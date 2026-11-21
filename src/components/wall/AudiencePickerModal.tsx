import { useEffect, useId, useMemo, useState } from 'react';
import { Check, Plus, Search, UserX } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useWallStore, useWallAccess } from '../../store/wallStore';
import { audienceReach, connectionIdsOf, normalizeAudience } from '../../lib/audience';
import type { Audience, AudienceBase, AudienceContext } from '../../types/wall';
import { AUDIENCE_BASES_FOR } from '../../types/wall';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { AUDIENCE_ICON, audienceBaseHint, audienceBaseLabel } from './wallText';
import { PersonAvatar } from './PersonAvatar';
import { formatLocationArea } from '../../lib/eventDisplay';

const EXCLUDABLE: AudienceBase[] = ['public', 'connections', 'friends_of_friends', 'list'];

/** Checklist of people with search (used for "specific", "except" and list members). */
export function PeopleChecklist({
  candidateIds,
  selected,
  onChange,
  label,
  emptyText,
}: {
  candidateIds: string[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label: string;
  emptyText: string;
}) {
  const { t, language } = useLanguage();
  const users = useStore((s) => s.users);
  const [q, setQ] = useState('');
  const people = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return candidateIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .filter((u) => !ql || u.name.toLowerCase().includes(ql) || (u.city ?? '').toLowerCase().includes(ql))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [candidateIds, users, q]);
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  if (candidateIds.length === 0) {
    return <p className="rounded-xl border border-dashed border-border px-3 py-3 text-xs font-medium text-ink-muted">{emptyText}</p>;
  }
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{label}</legend>
      {candidateIds.length > 6 && (
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <Search className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('Αναζήτηση ονόματος…', 'Search names…')}
            aria-label={t('Αναζήτηση ατόμων', 'Search people')}
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </label>
      )}
      <ul className="max-h-52 space-y-1 overflow-y-auto pr-1">
        {people.map((u) => {
          const on = selected.includes(u.id);
          return (
            <li key={u.id}>
              <label
                className={cn(
                  'flex min-h-8 cursor-pointer items-center gap-3 rounded-xl border px-3 py-1.5 transition-colors',
                  on ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface',
                )}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(u.id)} className="h-4 w-4 accent-[var(--color-accent)]" />
                <PersonAvatar user={u} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{u.name}</span>
                {u.city && <span className={cn('text-xs font-medium', on ? 'text-ink' : 'text-ink-muted')}>{formatLocationArea(u.city, language)}</span>}
              </label>
            </li>
          );
        })}
        {people.length === 0 && (
          <li className="px-3 py-2 text-xs font-medium text-ink-muted">{t('Κανένα αποτέλεσμα', 'No matches')}</li>
        )}
      </ul>
    </fieldset>
  );
}

/**
 * "Ποιος το βλέπει;" — one picker for posts, profile, sections and wall rules.
 * Shows a live count of who would see it so the choice is never abstract.
 */
export function AudiencePickerModal({
  open,
  onClose,
  value,
  context = 'post',
  title,
  description,
  onSave,
  showMakeDefault = false,
}: {
  open: boolean;
  onClose: () => void;
  value: Audience;
  context?: AudienceContext;
  title?: string;
  description?: string;
  onSave: (audience: Audience, opts: { makeDefault: boolean }) => void;
  showMakeDefault?: boolean;
}) {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const lists = useWallStore((s) => s.lists);
  const createList = useWallStore((s) => s.createList);
  const access = useWallAccess();
  const groupName = useId();
  const allowed = AUDIENCE_BASES_FOR[context];

  const [draft, setDraft] = useState<Audience>(() => normalizeAudience(value, allowed));
  const [showExcept, setShowExcept] = useState(Boolean(value.excludeIds?.length));
  const [makeDefault, setMakeDefault] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(normalizeAudience(value, allowed));
      setShowExcept(Boolean(value.excludeIds?.length));
      setMakeDefault(false);
      setCreatingList(false);
      setNewListName('');
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const myId = me?.id ?? '';
  const myLists = useMemo(() => lists.filter((l) => l.ownerId === myId), [lists, myId]);
  const connectionIds = useMemo(() => (myId ? connectionIdsOf(access.graph, myId) : []), [access.graph, myId]);
  const everyoneIds = useMemo(() => users.filter((u) => u.id !== myId).map((u) => u.id), [users, myId]);

  const reachIds = useMemo(() => (myId ? audienceReach(myId, normalizeAudience(draft, allowed), access.graph) : []), [myId, draft, allowed, access.graph]);
  const reachFor = (base: AudienceBase) =>
    myId
      ? audienceReach(
          myId,
          base === 'list' ? { base, listId: draft.listId ?? myLists[0]?.id } : base === 'specific' ? { base, includeIds: draft.includeIds ?? [] } : { base },
          access.graph,
        ).length
      : 0;

  const pickBase = (base: AudienceBase) => {
    setDraft((d) => {
      if (base === 'specific') return { base, includeIds: d.includeIds ?? [] };
      if (base === 'list') return { base, listId: d.listId ?? myLists[0]?.id, excludeIds: d.excludeIds };
      if (base === 'only_me') return { base };
      return { base, excludeIds: d.excludeIds };
    });
  };

  const exceptCandidates = draft.base === 'public' ? everyoneIds : connectionIds;
  const canSave =
    (draft.base !== 'specific' || (draft.includeIds?.length ?? 0) > 0) &&
    (draft.base !== 'list' || Boolean(draft.listId && myLists.some((l) => l.id === draft.listId)));

  const handleCreateList = () => {
    const res = createList(newListName, []);
    if (!res.ok) {
      toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
      return;
    }
    setDraft((d) => ({ ...d, base: 'list', listId: res.id }));
    setCreatingList(false);
    setNewListName('');
    toast.success(t('Η λίστα δημιουργήθηκε — πρόσθεσε μέλη από τη διαχείριση λιστών', 'List created — add members from list settings'));
  };

  const save = () => {
    const clean = normalizeAudience(
      showExcept || draft.base === 'specific' ? draft : { ...draft, excludeIds: undefined },
      allowed,
    );
    onSave(clean, { makeDefault });
    onClose();
  };

  const names = reachIds
    .slice(0, 3)
    .map((id) => users.find((u) => u.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <Modal open={open} onClose={onClose} title={title ?? t('Ποιος το βλέπει;', 'Who can see this?')} size="lg">
      {description && <p className="-mt-2 mb-3 text-sm font-medium text-ink-muted">{description}</p>}
      <div role="radiogroup" aria-label={title ?? t('Κοινό', 'Audience')} className="space-y-2">
        {allowed.map((base) => {
          const Icon = AUDIENCE_ICON[base];
          const on = draft.base === base;
          const count = reachFor(base);
          const disabled = base === 'list' && myLists.length === 0 && !creatingList;
          return (
            <div key={base}>
              <label
                className={cn(
                  'flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors',
                  on ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface',
                )}
              >
                <input
                  type="radio"
                  name={groupName}
                  checked={on}
                  onChange={() => (disabled ? setCreatingList(true) : pickBase(base))}
                  className="sr-only"
                />
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', on ? 'bg-accent text-accent-fg' : 'bg-surface text-ink')}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{audienceBaseLabel(base, t)}</span>
                  <span className={cn('block text-xs font-medium', on ? 'text-ink' : 'text-ink-muted')}>{audienceBaseHint(base, t)}</span>
                </span>
                {base !== 'only_me' && base !== 'specific' && base !== 'list' && (
                  <span className={cn('shrink-0 text-xs font-bold tabular-nums', on ? 'text-ink' : 'text-ink-muted')}>
                    {count === 1 ? t('1 άτομο', '1 person') : t(`${count} άτομα`, `${count} people`)}
                  </span>
                )}
                {on && <Check className="h-4 w-4 shrink-0 text-ink" aria-hidden />}
              </label>

              {on && base === 'specific' && (
                <div className="mt-2 pl-2">
                  <PeopleChecklist
                    candidateIds={connectionIds}
                    selected={draft.includeIds ?? []}
                    onChange={(ids) => setDraft({ base: 'specific', includeIds: ids })}
                    label={t('Ποιοι Nakamas το βλέπουν', 'Which Nakamas see it')}
                    emptyText={t('Δεν έχεις ακόμα Nakamas — σύνδεσου με άτομα από τις εκδηλώσεις σου.', 'No Nakamas yet — connect with people from your events.')}
                  />
                </div>
              )}

              {base === 'list' && (on || disabled) && (
                <div className="mt-2 space-y-2 pl-2">
                  {myLists.map((l) => (
                    <label key={l.id} className={cn('flex min-h-8 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2', draft.listId === l.id && on ? 'border-accent bg-accent-soft' : 'border-border hover:bg-surface')}>
                      <input
                        type="radio"
                        name={`${groupName}-list`}
                        checked={on && draft.listId === l.id}
                        onChange={() => setDraft((d) => ({ base: 'list', listId: l.id, excludeIds: d.excludeIds }))}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                      <span className="flex-1 text-sm font-bold text-ink">{l.name}</span>
                      <span className={cn('text-xs font-medium', on && draft.listId === l.id ? 'text-ink' : 'text-ink-muted')}>
                        {l.memberIds.length === 1 ? t('1 μέλος', '1 member') : t(`${l.memberIds.length} μέλη`, `${l.memberIds.length} members`)}
                      </span>
                    </label>
                  ))}
                  {creatingList ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateList();
                          }
                        }}
                        maxLength={40}
                        placeholder={t('Όνομα λίστας, π.χ. «Σινεφίλ»', 'List name, e.g. “Movie buffs”')}
                        aria-label={t('Όνομα νέας λίστας', 'New list name')}
                        className="min-h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                      />
                      <Button size="sm" onClick={handleCreateList} disabled={!newListName.trim()}>
                        {t('Δημιουργία', 'Create')}
                      </Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setCreatingList(true)} className="flex min-h-8 items-center gap-2 rounded-xl px-3 text-xs font-bold text-ink hover:bg-surface">
                      <Plus className="h-3.5 w-3.5" aria-hidden /> {t('Νέα λίστα', 'New list')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {EXCLUDABLE.includes(draft.base) && allowed.includes(draft.base) && context !== 'whoCanComment' && (
        <div className="mt-3 rounded-2xl border border-border p-3">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              <UserX className="h-4 w-4" aria-hidden /> {t('Εκτός από…', 'Except…')}
            </span>
            <input
              type="checkbox"
              checked={showExcept}
              onChange={(e) => setShowExcept(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
          </label>
          <p className="mt-1 text-xs font-medium text-ink-muted">
            {t('Άτομα που δεν θα το βλέπουν ποτέ, ακόμη κι αν ανήκουν στο κοινό.', 'People who never see it, even if they are in the audience.')}
          </p>
          {showExcept && (
            <div className="mt-2">
              <PeopleChecklist
                candidateIds={exceptCandidates}
                selected={draft.excludeIds ?? []}
                onChange={(ids) => setDraft((d) => ({ ...d, excludeIds: ids }))}
                label={t('Ποιοι δεν το βλέπουν', 'Who does not see it')}
                emptyText={t('Δεν υπάρχουν άτομα για εξαίρεση.', 'Nobody to exclude.')}
              />
            </div>
          )}
        </div>
      )}

      <div className="mt-4 rounded-2xl bg-surface px-3 py-2.5" role="status" aria-live="polite">
        <p className="text-sm font-bold text-ink">
          {draft.base === 'only_me'
            ? t('Μόνο εσύ θα το βλέπεις', 'Only you will see it')
            : reachIds.length === 0
              ? t('Κανείς άλλος δεν θα το βλέπει ακόμα', 'Nobody else will see it yet')
              : reachIds.length === 1
                ? t('Θα το βλέπει 1 άτομο', '1 person will see it')
                : t(`Θα το βλέπουν ${reachIds.length} άτομα`, `${reachIds.length} people will see it`)}
        </p>
        {names && draft.base !== 'public' && (
          <p className="text-xs font-medium text-ink-muted">
            {names}
            {reachIds.length > 3 ? t(` και ${reachIds.length - 3} ακόμη`, ` and ${reachIds.length - 3} more`) : ''}
          </p>
        )}
      </div>

      {showMakeDefault && (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
          {t('Κράτα το ως προεπιλογή για νέες δημοσιεύσεις', 'Keep this as the default for new posts')}
        </label>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t('Ακύρωση', 'Cancel')}
        </Button>
        <Button size="sm" onClick={save} disabled={!canSave}>
          {t('Τέλος', 'Done')}
        </Button>
      </div>
    </Modal>
  );
}
