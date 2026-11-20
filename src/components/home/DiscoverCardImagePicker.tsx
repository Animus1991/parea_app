import { Image } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import {
  CARD_IMAGE_DEPTH_LABELS,
  type EventCardImageDepth,
} from '../../lib/discoverCardImagePreview';
import { cn } from '../../lib/utils';
import { HOME_TYPO } from '../../lib/typographyTokens';

const CHIP =
  'filter-chip inline-flex h-[1.75rem] items-center rounded-full border px-3 text-xs font-bold leading-none whitespace-nowrap';

export function DiscoverCardImagePicker({
  depth,
  options,
  onChange,
}: {
  depth: EventCardImageDepth;
  options: readonly EventCardImageDepth[];
  onChange: (next: EventCardImageDepth) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mb-3" data-card-image-picker>
      <p className={cn(HOME_TYPO.sectionLabel, 'mb-1.5 flex items-center gap-1.5 text-ink-muted')}>
        <Image className="size-3.5 shrink-0" aria-hidden />
        {t('Εικόνα κάρτας', 'Card photo')}
      </p>
      <div
        role="radiogroup"
        aria-label={t('Εικόνα κάρτας', 'Card photo')}
        className="flex flex-wrap gap-1.5"
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
    </div>
  );
}
