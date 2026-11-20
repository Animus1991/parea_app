import { useMemo, useState, type ElementType } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Eye, Info, ListChecks, MessageCircle, Newspaper, PenLine, ShieldHalf, Tag, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useWallStore } from '../../store/wallStore';
import { AUDIENCE_RANK, profileVisibilityToAudience, wallPrivacyOf } from '../../lib/audience';
import { resolveProfileAudience } from '../../lib/profilePrivacy';
import type { Audience, AudienceContext, ProfileSectionKey } from '../../types/wall';
import { PROFILE_SECTION_KEYS } from '../../types/wall';
import { AudienceChip } from './AudienceChip';
import { AudiencePickerModal } from './AudiencePickerModal';
import { AudienceListsManager } from './AudienceListsManager';
import { sectionHint, sectionLabel } from './wallText';

type Editing =
  | { kind: 'profile' }
  | { kind: 'default' | 'whoCanPost' | 'othersPosts' | 'whoCanComment' }
  | { kind: 'section'; key: ProfileSectionKey }
  | null;

function Row({
  icon: Icon,
  title,
  hint,
  audience,
  onEdit,
}: {
  icon: ElementType;
  title: string;
  hint: string;
  audience: Audience;
  onEdit: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
          <Icon className="h-4 w-4 text-ink-muted" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">{title}</p>
          <p className="text-xs font-medium text-ink-muted">{hint}</p>
        </div>
      </div>
      <AudienceChip audience={audience} onClick={onEdit} className="self-start sm:self-center" />
    </div>
  );
}

const SECTION_ICON: Record<ProfileSectionKey, ElementType> = {
  about: UserRound,
  interests: Info,
  connections: Users,
  events: CalendarDays,
};

/**
 * «Τοίχος, προφίλ & κοινό» — every audience setting of the social layer in
 * one list, each showing its current value and opening the same picker.
 */
export function WallPrivacyPanel({ showProfileRow = true }: { showProfileRow?: boolean } = {}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const privacy = useStore((s) => s.userSettings.privacy);
  const updatePrivacySettings = useStore((s) => s.updatePrivacySettings);
  const privacyByUser = useWallStore((s) => s.privacyByUser);
  const posts = useWallStore((s) => s.posts);
  const { updateWallPrivacy, limitPastPosts, restoreAudiences } = useWallStore.getState();
  const [editing, setEditing] = useState<Editing>(null);
  const [listsOpen, setListsOpen] = useState(false);
  const [confirmLimit, setConfirmLimit] = useState(false);

  const myId = me?.id ?? '';
  const wp = wallPrivacyOf(privacyByUser, myId);
  const profileAudience = resolveProfileAudience(privacy) ?? profileVisibilityToAudience(privacy.profileVisibility);
  const widePosts = useMemo(
    () => posts.filter((p) => p.authorId === myId && p.wallOwnerId === myId && AUDIENCE_RANK[p.audience.base] > AUDIENCE_RANK.connections).length,
    [posts, myId],
  );

  if (!me) return null;

  const pickerValue: Audience =
    editing?.kind === 'profile'
      ? profileAudience
      : editing?.kind === 'default'
        ? wp.defaultAudience
        : editing?.kind === 'whoCanPost'
          ? wp.whoCanPost
          : editing?.kind === 'othersPosts'
            ? wp.othersPostsAudience
            : editing?.kind === 'whoCanComment'
              ? wp.whoCanComment
              : editing?.kind === 'section'
                ? wp.sections[editing.key]
                : { base: 'connections' };

  const pickerContext: AudienceContext =
    editing?.kind === 'whoCanPost' ? 'whoCanPost' : editing?.kind === 'whoCanComment' ? 'whoCanComment' : editing?.kind === 'profile' ? 'profile' : 'post';

  const pickerTitle =
    editing?.kind === 'profile'
      ? t('Ποιος βλέπει το προφίλ μου;', 'Who can see my profile?')
      : editing?.kind === 'default'
        ? t('Προεπιλεγμένο κοινό νέων δημοσιεύσεων', 'Default audience for new posts')
        : editing?.kind === 'whoCanPost'
          ? t('Ποιος γράφει στον τοίχο μου;', 'Who can post on my wall?')
          : editing?.kind === 'othersPosts'
            ? t('Ποιος βλέπει τι γράφουν άλλοι στον τοίχο μου;', 'Who sees what others post on my wall?')
            : editing?.kind === 'whoCanComment'
              ? t('Ποιος σχολιάζει τις δημοσιεύσεις μου;', 'Who can comment on my posts?')
              : editing?.kind === 'section'
                ? t(`Ποιος βλέπει: ${sectionLabel(editing.key, t)}`, `Who sees: ${sectionLabel(editing.key, t)}`)
                : '';

  const save = (a: Audience) => {
    if (!editing) return;
    if (editing.kind === 'profile') updatePrivacySettings({ profileAudience: a });
    else if (editing.kind === 'default') updateWallPrivacy({ defaultAudience: a });
    else if (editing.kind === 'whoCanPost') updateWallPrivacy({ whoCanPost: a });
    else if (editing.kind === 'othersPosts') updateWallPrivacy({ othersPostsAudience: a });
    else if (editing.kind === 'whoCanComment') updateWallPrivacy({ whoCanComment: a });
    else if (editing.kind === 'section') updateWallPrivacy({ sections: { [editing.key]: a } });
    toast.success(t('Οι ρυθμίσεις απορρήτου αποθηκεύτηκαν', 'Privacy settings saved'));
  };

  const doLimit = () => {
    const previous = limitPastPosts();
    const n = Object.keys(previous).length;
    setConfirmLimit(false);
    toast.success(
      n === 1 ? t('1 δημοσίευση είναι πλέον μόνο για τους Nakamas σου', '1 post is now for your Nakamas only') : t(`${n} δημοσιεύσεις είναι πλέον μόνο για τους Nakamas σου`, `${n} posts are now for your Nakamas only`),
      { action: { label: t('Αναίρεση', 'Undo'), onClick: () => restoreAudiences(previous) } },
    );
  };

  return (
    <section id="wall-privacy" className="space-y-3 scroll-mt-24" aria-labelledby="wall-privacy-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="wall-privacy-title" className="text-xs font-bold tracking-wide text-ink-muted">
          {t('Προφίλ, τοίχος & κοινό', 'Profile, wall & audience')}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(`/u/${me.id}?viewAs=public`)} className="gap-1.5">
            <Eye className="h-3.5 w-3.5" aria-hidden /> {t('Δες το προφίλ σου ως…', 'View your profile as…')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setListsOpen(true)} className="gap-1.5">
            <ListChecks className="h-3.5 w-3.5" aria-hidden /> {t('Λίστες κοινού', 'Audience lists')}
          </Button>
        </div>
      </div>

      {showProfileRow && (
        <Row
          icon={ShieldHalf}
          title={t('Ποιος βλέπει το προφίλ μου', 'Who can see my profile')}
          hint={t('Όσοι δεν είναι στο κοινό βλέπουν μόνο ότι το προφίλ είναι ιδιωτικό.', 'People outside the audience only see that the profile is private.')}
          audience={profileAudience}
          onEdit={() => setEditing({ kind: 'profile' })}
        />
      )}

      {PROFILE_SECTION_KEYS.map((key) => (
        <Row
          key={key}
          icon={SECTION_ICON[key]}
          title={sectionLabel(key, t)}
          hint={sectionHint(key, t)}
          audience={wp.sections[key]}
          onEdit={() => setEditing({ kind: 'section', key })}
        />
      ))}

      <p className="pt-1 text-xs font-bold text-ink-muted">{t('Δημοσιεύσεις & τοίχος', 'Posts & wall')}</p>
      <Row
        icon={Newspaper}
        title={t('Προεπιλεγμένο κοινό νέων δημοσιεύσεων', 'Default audience for new posts')}
        hint={t('Μπορείς να το αλλάζεις σε κάθε δημοσίευση.', 'You can still change it on every post.')}
        audience={wp.defaultAudience}
        onEdit={() => setEditing({ kind: 'default' })}
      />
      <Row
        icon={PenLine}
        title={t('Ποιος γράφει στον τοίχο μου', 'Who can post on my wall')}
        hint={t('Οι Nakamas σου, επιλεγμένα άτομα ή κανείς.', 'Your Nakamas, chosen people or nobody.')}
        audience={wp.whoCanPost}
        onEdit={() => setEditing({ kind: 'whoCanPost' })}
      />
      <Row
        icon={Eye}
        title={t('Ποιος βλέπει τι γράφουν άλλοι στον τοίχο μου', 'Who sees what others post on my wall')}
        hint={t('Ισχύει και για παλαιότερες δημοσιεύσεις.', 'Also applies to earlier posts.')}
        audience={wp.othersPostsAudience}
        onEdit={() => setEditing({ kind: 'othersPosts' })}
      />
      <Row
        icon={MessageCircle}
        title={t('Ποιος σχολιάζει τις δημοσιεύσεις μου', 'Who can comment on my posts')}
        hint={t('Μόνο όσοι βλέπουν τη δημοσίευση. Μπορείς να κλείνεις σχόλια ανά δημοσίευση.', 'Only people who can see the post. You can turn comments off per post.')}
        audience={wp.whoCanComment}
        onEdit={() => setEditing({ kind: 'whoCanComment' })}
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface">
          <Tag className="h-4 w-4 text-ink-muted" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-ink">{t('Έλεγχος ετικετών', 'Tag review')}</span>
          <span className="block text-xs font-medium text-ink-muted">
            {t(
              'Δημοσιεύσεις όπου σε επισημαίνουν εμφανίζονται στο προφίλ σου μόνο αφού τις εγκρίνεις.',
              'Posts you are tagged in show on your profile only after you approve them.',
            )}
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={wp.reviewTags}
          onChange={(e) => {
            updateWallPrivacy({ reviewTags: e.target.checked });
            toast.success(e.target.checked ? t('Ο έλεγχος ετικετών ενεργοποιήθηκε', 'Tag review on') : t('Ο έλεγχος ετικετών απενεργοποιήθηκε', 'Tag review off'));
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        />
      </label>

      <div className="rounded-2xl border border-border p-3">
        <p className="text-sm font-bold text-ink">{t('Περιορισμός παλαιότερων δημοσιεύσεων', 'Limit past posts')}</p>
        <p className="text-xs font-medium text-ink-muted">
          {widePosts === 0
            ? t('Καμία δημοσίευσή σου δεν είναι ορατή πέρα από τους Nakamas σου.', 'None of your posts is visible beyond your Nakamas.')
            : t(
                `${widePosts} δημοσιεύσεις σου είναι ορατές πέρα από τους Nakamas σου. Κάν' τες μόνο για Nakamas με ένα κλικ.`,
                `${widePosts} of your posts are visible beyond your Nakamas. Make them Nakamas-only in one tap.`,
              )}
        </p>
        {widePosts > 0 &&
          (confirmLimit ? (
            <div className="mt-2 flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirmLimit(false)}>
                {t('Άκυρο', 'Cancel')}
              </Button>
              <Button size="sm" onClick={doLimit}>
                {t('Ναι, περιόρισέ τες', 'Yes, limit them')}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setConfirmLimit(true)}>
              {t('Περιορισμός', 'Limit')}
            </Button>
          ))}
      </div>

      <AudiencePickerModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        value={pickerValue}
        context={pickerContext}
        title={pickerTitle}
        onSave={save}
      />
      <AudienceListsManager open={listsOpen} onClose={() => setListsOpen(false)} />
    </section>
  );
}
