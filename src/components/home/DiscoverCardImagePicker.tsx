import { useState } from 'react';
import { ChevronDown, Image } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import {
  CARD_IMAGE_DEPTH_LABELS,
  type EventCardImageDepth,
} from '../../lib/discoverCardImagePreview';
import { cn } from '../../lib/utils';
import { HOME_TYPO } from '../../lib/typographyTokens';

const CHIP =
  'filter-chip inline-flex h-[1.75rem] items-center rounded-full border px-3 text-xs font-bold leading-none whitespace-nowrap';

/**
 * Card-photo depth for the Discover feed. Collapsed by default to one quiet
 * chip that names the current choice; the options open in place, so layouts
 * can still be compared live on the feed without seven chips on first view.
 */
export function DiscoverCardImagePicker({
  depth,
  options,
  onChange,
  expanded = false,
}: {
  depth: EventCardImageDepth;
  options: readonly EventCardImageDepth[];
  onChange: (next: EventCardImageDepth) => void;
  /** Settings already opened this on purpose: show the options without the toggle. */
  expanded?: boolean;
}) {
  const { t } = useLanguage();
  const [toggled, setOpen] = useState(false);
  const open = expanded || toggled;
  const [currentEl, currentEn] = CARD_IMAGE_DEPTH_LABELS[depth];

  return (
    <div className="mb-3" data-card-image-picker>
      {!expanded && (
        <button
          type="button"
          data-card-image-toggle
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            HOME_TYPO.sectionLabel,
            'inline-flex min-h-8 items-center gap-1.5 rounded-full text-ink-muted transition-colors hover:text-ink',
        )}
      >
        <Image className="size-3.5 shrink-0" aria-hidden />
        <span>
          {t('Εικόνα κάρτας', 'Card photo')}: <span className="text-ink">{t(currentEl, currentEn)}</span>
        </span>
        <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      )}
      {open && (
        <div
          role="radiogroup"
          aria-label={t('Εικόνα κάρτας', 'Card photo')}
          className={cn('flex flex-wrap gap-1.5', !expanded && 'mt-1.5')}
        >
          {options.map((option) => {
            const [el, en] = CARD_IMAGE_DEPTH_LABELS[option];
            const selected = depth === option;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                data-card-image-option={option}
                onClick={() => onChange(option)}
                className={cn(
                  CHIP,
                  HOME_TYPO.filterChip,
                  selected
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border bg-surface-raised text-ink',
                )}
              >
                {t(el, en)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
