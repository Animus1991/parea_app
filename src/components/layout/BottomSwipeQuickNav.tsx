import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { ArrowUpToLine, Check, Minus, Pencil, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { useQuickNavLayout } from '../../hooks/useQuickNavLayout';
import { prefetchPath } from '../../lib/routeLoaders';
import { BOTTOM_SWIPE_QUICK_NAV_ENABLED } from '../../lib/bottomSwipeQuickNav';
import {
  QUICK_NAV_GROUPS,
  QUICK_NAV_MIN_BAR,
  barCaption,
  type QuickNavTileDef,
} from '../../lib/quickNavLayout';
import { quickNavIcon } from '../../lib/quickNavIcons';

function TileLink({
  tile,
  onNavigate,
  compact,
}: {
  tile: QuickNavTileDef;
  onNavigate: () => void;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const Icon = quickNavIcon(tile.id);
  const label = compact ? t(barCaption(tile).el, barCaption(tile).en) : t(tile.labelEl, tile.labelEn);

  return (
    <NavLink
      to={tile.path}
      aria-label={label}
      title={label}
      onClick={onNavigate}
      onTouchStart={() => prefetchPath(tile.path)}
      onFocus={() => prefetchPath(tile.path)}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 rounded-xl min-h-11 px-1 py-2 text-center transition-colors',
          isActive ? tok.navActive : tok.navInactive,
        )
      }
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden />
      <span className="text-xs font-medium leading-none line-clamp-2">{label}</span>
    </NavLink>
  );
}

function BadgeButton({
  kind,
  label,
  onClick,
}: {
  kind: 'add' | 'remove' | 'pin';
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className={cn(
        'absolute z-10 flex h-8 w-8 items-center justify-center',
        kind === 'pin' ? '-left-2 -top-2' : '-right-2 -top-2',
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-full text-white shadow-round',
          kind === 'add' && 'bg-emerald-500',
          kind === 'remove' && 'bg-red-500',
          kind === 'pin' && 'bg-cyan-600',
        )}
      >
        {kind === 'add' ? <Plus className="h-3 w-3" /> : kind === 'remove' ? <Minus className="h-3 w-3" /> : <ArrowUpToLine className="h-3 w-3" />}
      </span>
    </button>
  );
}

function EditTile({
  tile,
  index,
  compact,
  onRemove,
  onPin,
  onMove,
}: {
  tile: QuickNavTileDef;
  index: number;
  compact?: boolean;
  onRemove?: () => void;
  onPin?: () => void;
  onMove?: (from: number, to: number) => void;
}) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const Icon = quickNavIcon(tile.id);
  const label = compact ? t(barCaption(tile).el, barCaption(tile).en) : t(tile.labelEl, tile.labelEn);

  return (
    <div
      data-quick-nav-index={index}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl min-h-14 px-2 py-2 text-center"
      onPointerUp={(event) => {
        if (onMove == null) return;
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        const target = hit instanceof Element ? hit.closest('[data-quick-nav-index]') : null;
        if (!target) return;
        const to = Number(target.getAttribute('data-quick-nav-index'));
        if (Number.isFinite(to) && to !== index) onMove(index, to);
      }}
    >
      {onPin && (
        <BadgeButton kind="pin" label={t('Στην κάτω μπάρα', 'Pin to the bar')} onClick={onPin} />
      )}
      {onRemove && (
        <BadgeButton kind="remove" label={t('Αφαίρεση', 'Remove')} onClick={onRemove} />
      )}
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', tok.isDark ? 'bg-white/10' : 'bg-black/[0.04]')}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="text-xs font-medium leading-none line-clamp-2 text-ink">{label}</span>
    </div>
  );
}

function AvailableTile({ tile, onAdd }: { tile: QuickNavTileDef; onAdd: () => void }) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const Icon = quickNavIcon(tile.id);
  const label = t(tile.labelEl, tile.labelEn);
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={t(`Προσθήκη: ${label}`, `Add ${label}`)}
      className="relative flex flex-col items-center justify-center gap-1 rounded-xl min-h-14 px-2 py-2 text-center"
    >
      <span className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-round">
        <Plus className="h-3 w-3" aria-hidden />
      </span>
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', tok.isDark ? 'bg-white/10' : 'bg-black/[0.04]')}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <span className="text-xs font-medium leading-none line-clamp-2 text-ink">{label}</span>
    </button>
  );
}

export function BottomSwipeQuickNav({
  onClose,
}: {
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const tok = useThemeStyles();
  const panelRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const nav = useQuickNavLayout();
  useOverlayBehavior(true, () => (editing ? setEditing(false) : onClose()), panelRef);

  if (!BOTTOM_SWIPE_QUICK_NAV_ENABLED) return null;

  const leftCount = Math.floor(nav.bar.length / 2);
  const barLeft = nav.bar.slice(0, leftCount);
  const barRight = nav.bar.slice(leftCount);
  const canRemove = nav.layout.active.length > QUICK_NAV_MIN_BAR;

  const removeOrToast = (id: string) => {
    if (!canRemove) {
      toast.message(t('Κράτα τουλάχιστον δύο συντομεύσεις στην μπάρα.', 'Keep at least two shortcuts on the bar.'));
      return;
    }
    nav.remove(id);
  };

  return createPortal(
    <div
      className="md:hidden fixed inset-x-0 top-0 z-modal"
      style={{ bottom: 'var(--bottom-nav-total)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-swipe-quick-nav-title"
      data-bottom-swipe-quick-nav="true"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('Κλείσιμο', 'Close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 motion-reduce:animate-none"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'absolute bottom-0 left-0 right-0 flex max-h-[min(88vh,calc(100dvh-var(--header-h)-1rem))] flex-col rounded-t-2xl border-t border-x border-border bg-surface-raised text-ink shadow-soft-lg outline-none',
          'animate-in slide-in-from-bottom duration-300 motion-reduce:animate-none',
          tok.isDark ? 'border-gray-700' : 'border-gray-200',
        )}
      >
        <div data-bottom-swipe-sheet="" className="shrink-0 touch-none px-3 pt-2">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border-strong" aria-hidden />
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="bottom-swipe-quick-nav-title" className="text-sm font-bold text-ink">
              {editing
                ? t('Επεξεργασία συντομεύσεων', 'Edit shortcuts')
                : t('Γρήγορη πρόσβαση', 'Quick access')}
            </h2>
            {editing ? (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex min-h-9 items-center gap-1 rounded-full bg-cyan-600 px-3 text-xs font-bold text-white"
              >
                <Check className="h-4 w-4" aria-hidden />
                {t('Έτοιμο', 'Done')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-ink-muted hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                {t('Επεξεργασία', 'Edit')}
              </button>
            )}
          </div>
        </div>

        <div
          data-quick-nav-editing={editing ? '' : undefined}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain touch-pan-y px-3 pb-4"
        >
          {editing ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium leading-relaxed text-ink-muted">
                  {t(
                    'Πάτα + για να μπει στο μενού. Πάτα − για να φύγει. Όσες θες.',
                    'Tap + to add it to the menu. Tap − to remove it. As many as you want.',
                  )}
                </p>
                <button
                  type="button"
                  onClick={nav.reset}
                  className="shrink-0 text-xs font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
                >
                  {t('Επαναφορά', 'Reset')}
                </button>
              </div>

              <section>
                <h3 className="mb-2 text-xs font-bold text-ink">{t('Κάτω μπάρα', 'Bottom bar')}</h3>
                <div className="flex items-end justify-around rounded-2xl bg-surface px-1 py-3 shadow-soft">
                  {barLeft.map((tile, i) => (
                    <EditTile
                      key={tile.id}
                      tile={tile}
                      index={i}
                      compact
                      onRemove={() => removeOrToast(tile.id)}
                      onMove={nav.move}
                    />
                  ))}
                  <div className="flex flex-col items-center gap-1 px-1 opacity-70">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white">
                      <Plus className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-xs font-medium">{t('Δημιουργία', 'Create')}</span>
                  </div>
                  {barRight.map((tile, i) => (
                    <EditTile
                      key={tile.id}
                      tile={tile}
                      index={leftCount + i}
                      compact
                      onRemove={() => removeOrToast(tile.id)}
                      onMove={nav.move}
                    />
                  ))}
                </div>
              </section>

              <section id="quick-nav-available">
                <h3 className="mb-1 text-xs font-bold text-ink">
                  {t('Κι άλλες λειτουργίες', 'More pages')}
                  {nav.available.length > 0
                    ? ` · ${nav.available.length}`
                    : ''}
                </h3>
                <p className="mb-2 text-xs font-medium text-ink-muted">
                  {nav.available.length > 0
                    ? t('Πρόσθεσε όσες θες — δεν υπάρχει όριο.', 'Add as many as you want — there is no cap.')
                    : t('Τις έχεις όλες στο μενού. Αφαίρεσε κάποια για να ξαναφανεί εδώ.', 'They are all on the menu. Remove one to see it here again.')}
                </p>
                {nav.available.length > 0 ? (
                  QUICK_NAV_GROUPS.map((group) => {
                    const tiles = nav.available.filter((tile) => tile.group === group.id);
                    if (tiles.length === 0) return null;
                    return (
                      <div key={group.id} className="mb-3">
                        <p className="mb-1.5 text-2xs font-bold uppercase tracking-wide text-ink-muted">
                          {t(group.el, group.en)}
                        </p>
                        <div className="grid grid-cols-4 gap-1">
                          {tiles.map((tile) => (
                            <AvailableTile key={tile.id} tile={tile} onAdd={() => nav.add(tile.id)} />
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : null}
              </section>

              <section>
                <h3 className="mb-2 text-xs font-bold text-ink">{t('Στο μενού τώρα', 'On the menu now')}</h3>
                {nav.sheet.length === 0 ? (
                  <p className="rounded-2xl bg-surface px-4 py-5 text-center text-xs font-medium text-ink-muted">
                    {t('Το μενού είναι άδειο. Πρόσθεσε από πάνω.', 'The menu is empty. Add pages from above.')}
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    {nav.sheet.map((tile, i) => (
                      <EditTile
                        key={tile.id}
                        tile={tile}
                        index={nav.bar.length + i}
                        onRemove={() => removeOrToast(tile.id)}
                        onPin={() => nav.pinToBar(tile.id)}
                        onMove={nav.move}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1">
              {nav.sheet.map((tile) => (
                <TileLink key={tile.id} tile={tile} onNavigate={onClose} />
              ))}
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border px-1 py-2 text-ink-muted hover:border-accent hover:text-ink"
              >
                <Plus className="h-[18px] w-[18px]" aria-hidden />
                <span className="text-xs font-medium leading-none">{t('Προσθήκη', 'Add')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
