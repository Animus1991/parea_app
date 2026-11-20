import { useMemo } from 'react';
import { Users, HeartHandshake, BadgeCheck, Blend } from 'lucide-react';
import { useStore } from '../../store';
import { useWallAccess } from '../../store/wallStore';
import { useLanguage } from '../../lib/i18n';
import { canViewProfileSection } from '../../lib/audience';
import { groupComposition } from '../../lib/outings';
import { groupVibeFit, vibeFitLabel } from '../../lib/vibe';
import { cn } from '../../lib/utils';
import type { Group, User } from '../../types';

/**
 * «Η ομάδα με μια ματιά» (Meetup, adapted): women & non-binary chip, totals for
 * age span / shared interests / verified people (3+ members only, and only
 * from profile sections each member lets the viewer see), and how the
 * viewer's «στυλ παρέας» fits.
 */
export function GroupInsights({
  group,
  className,
  textClass = 'text-ink-muted',
  strongClass = 'text-ink',
  compact = false,
}: {
  group: Group;
  className?: string;
  textClass?: string;
  strongClass?: string;
  compact?: boolean;
}) {
  const { t, language } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const access = useWallAccess();

  const members = useMemo(
    () => group.members.map((id) => users.find((u) => u.id === id)).filter((u): u is User => Boolean(u)),
    [group.members, users],
  );

  const composition = useMemo(() => {
    // Totals only, and only from what each member shares with the viewer.
    const visible = members.map((m) => {
      if (m.id === me?.id) return m;
      const about = canViewProfileSection(me?.id, m.id, 'about', access);
      const interests = canViewProfileSection(me?.id, m.id, 'interests', access);
      return { ...m, ageRange: about ? m.ageRange : '', interests: interests ? m.interests : [] } as User;
    });
    return groupComposition(visible, language);
  }, [members, me?.id, access, language]);

  const fit = useMemo(() => {
    if (!me?.vibe || group.members.includes(me.id)) return null;
    return groupVibeFit(me.vibe, members.map((m) => m.vibe), t);
  }, [me, members, group.members, t]);

  const rows: { key: string; icon: typeof Users; text: string }[] = [];
  if (group.genderMode === 'women_nb') {
    rows.push({ key: 'g', icon: HeartHandshake, text: t('Γυναίκες & μη δυαδικά άτομα', 'Women & non-binary') });
  }
  if (composition) {
    const parts = [
      composition.ageSpan ? t(`Ηλικίες ${composition.ageSpan}`, `Ages ${composition.ageSpan}`) : null,
      composition.shared.length ? t(`Κοινά: ${composition.shared.join(', ')}`, `In common: ${composition.shared.join(', ')}`) : null,
    ].filter(Boolean);
    if (parts.length) rows.push({ key: 'c', icon: Users, text: parts.join(' · ') });
    if (composition.verified > 0) {
      rows.push({
        key: 'v',
        icon: BadgeCheck,
        text: t(`${composition.verified} με επαλήθευση ταυτότητας ή selfie`, `${composition.verified} with ID or selfie check`),
      });
    }
  }
  if (fit) {
    const why = fit.reasons.length ? ` — ${fit.reasons.join(', ').toLowerCase()}` : '';
    rows.push({ key: 'f', icon: Blend, text: `${vibeFitLabel(fit.score, t)}${why}` });
  }
  if (rows.length === 0) return null;

  return (
    <ul className={cn('space-y-1', className)} aria-label={t('Η ομάδα με μια ματιά', 'The group at a glance')}>
      {rows.slice(0, compact ? 2 : rows.length).map(({ key, icon: Icon, text }) => (
        <li key={key} className={cn('flex items-start gap-1.5 text-xs font-medium', textClass)}>
          <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', strongClass)} aria-hidden />
          <span className="min-w-0">{text}</span>
        </li>
      ))}
    </ul>
  );
}
