import { format, parseISO } from 'date-fns';
import { el as elLocale, enUS as enLocale } from 'date-fns/locale';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useStore } from '../../store';
import { cn } from '../../lib/utils';
import { HOME_TYPO } from '../../lib/typographyTokens';
import { AppSelect } from '../common/AppSelect';
import {
  HOME_TIME_WINDOWS,
  HOME_WEEKDAY_LABELS,
  HOME_WEEKDAY_ORDER,
  emptyHomeSchedule,
  scheduleFromCoarseAvailability,
  toggleListValue,
  upcomingDateKeys,
  type HomeScheduleFilter,
} from '../../lib/homeScheduleFilter';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const EMPTY_SCHEDULE_SLOTS: string[] = [];

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function HomeScheduleFilterPanel({
  schedule,
  onChange,
}: {
  schedule: HomeScheduleFilter;
  onChange: (next: HomeScheduleFilter) => void;
}) {
  const { t, language } = useLanguage();
  const h = useHomeTheme();
  const availability = useStore((s) => s.userSettings.availability);
  const discoverySchedule = useStore(
    (s) => s.currentUser?.discoveryPrefs?.schedule ?? EMPTY_SCHEDULE_SLOTS,
  );
  const dateLocale = language === 'en' ? enLocale : elLocale;
  const dates = upcomingDateKeys(14);
  const usualSlots = availability.length > 0 ? availability : discoverySchedule;

  const chip = (on: boolean) =>
    cn(
      HOME_TYPO.filterChip,
      'whitespace-nowrap px-3 min-h-8 rounded-full border transition-colors',
      on ? h.chipActive : h.chipInactive,
    );

  const coarse = scheduleFromCoarseAvailability(usualSlots);

  return (
    <div className="space-y-3">
      <div>
        <p className={cn('text-xs font-bold', h.labelMuted)}>
          {t('Πότε μπορώ να βγω', 'When I can go out')}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
          {t(
            'Μόνο βραδιές που χωράνε στο πρόγραμμά σου — οι υπόλοιπες μένουν θόρυβος.',
            'Only nights that fit your schedule — the rest is noise.',
          )}
        </p>
      </div>

      {coarse.weekdays.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(coarse)}
          className="text-xs font-bold text-accent min-h-8"
        >
          {t('Χρήση της συνήθους διαθεσιμότητας', 'Use my usual hours')}
        </button>
      )}

      <div>
        <p className={cn('text-2xs font-bold mb-1.5', h.labelMuted)}>{t('Μέρες', 'Days')}</p>
        <div className="flex flex-wrap gap-1.5">
          {HOME_WEEKDAY_ORDER.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() =>
                onChange({ ...schedule, weekdays: toggleListValue(schedule.weekdays, day) })
              }
              className={chip(schedule.weekdays.includes(day))}
            >
              {t(HOME_WEEKDAY_LABELS[day].el, HOME_WEEKDAY_LABELS[day].en)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className={cn('text-2xs font-bold mb-1.5', h.labelMuted)}>{t('Ώρες', 'Hours')}</p>
        <div className="flex flex-wrap gap-1.5">
          {HOME_TIME_WINDOWS.map((window) => (
            <button
              key={window.id}
              type="button"
              onClick={() =>
                onChange({
                  ...schedule,
                  windowIds: toggleListValue(schedule.windowIds, window.id),
                })
              }
              className={chip(schedule.windowIds.includes(window.id))}
            >
              {t(window.el, window.en)}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <AppSelect
            id="schedule-hour-from"
            ariaLabel={t('Από ώρα', 'From hour')}
            value={schedule.hourFrom == null ? '' : String(schedule.hourFrom)}
            onValueChange={(next) =>
              onChange({
                ...schedule,
                hourFrom: next === '' ? null : Number(next),
              })
            }
            placeholder={t('Από', 'From')}
            options={[
              { value: '', label: t('Από', 'From') },
              ...HOURS.map((hour) => ({ value: String(hour), label: hourLabel(hour) })),
            ]}
            className={cn(
              'h-[1.75rem] min-w-[6.5rem] rounded-full border px-3 text-xs font-bold bg-surface-raised',
              h.select,
            )}
          />
          <span className="text-xs text-ink-muted">–</span>
          <AppSelect
            id="schedule-hour-to"
            ariaLabel={t('Έως ώρα', 'Until hour')}
            value={schedule.hourTo == null ? '' : String(schedule.hourTo)}
            onValueChange={(next) =>
              onChange({
                ...schedule,
                hourTo: next === '' ? null : Number(next),
              })
            }
            placeholder={t('Έως', 'Until')}
            options={[
              { value: '', label: t('Έως', 'Until') },
              ...HOURS.map((hour) => ({ value: String(hour), label: hourLabel(hour) })),
            ]}
            className={cn(
              'h-[1.75rem] min-w-[6.5rem] rounded-full border px-3 text-xs font-bold bg-surface-raised',
              h.select,
            )}
          />
        </div>
      </div>

      <div>
        <p className={cn('text-2xs font-bold mb-1.5', h.labelMuted)}>
          {t('Συγκεκριμένες ημερομηνίες', 'Specific dates')}
        </p>
        <div className="flex gap-1.5 overflow-x-auto noscrollbar pb-0.5">
          {dates.map((iso) => {
            const d = parseISO(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() =>
                  onChange({ ...schedule, dates: toggleListValue(schedule.dates, iso) })
                }
                className={cn(chip(schedule.dates.includes(iso)), 'flex flex-col px-2.5 py-1')}
              >
                <span className="text-2xs leading-none">
                  {format(d, 'EEE', { locale: dateLocale })}
                </span>
                <span className="text-xs font-bold leading-tight">{format(d, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(emptyHomeSchedule())}
        className="text-xs font-bold text-ink-muted min-h-8"
      >
        {t('Οποιαδήποτε μέρα και ώρα', 'Any day and time')}
      </button>
    </div>
  );
}
