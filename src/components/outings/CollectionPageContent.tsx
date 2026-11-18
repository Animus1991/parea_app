import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Library } from 'lucide-react';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { collectionById, collectionEvents, formingGroups } from '../../lib/outings';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { EventCard } from '../events/EventCard';
import { EmptyState } from '../common/EmptyState';
import { Chip } from '../common/Chip';
import { CollectionsRail } from './CollectionsRail';
import { COLLECTION_ICONS } from './collectionIcons';
import { OrganizerCalendarCard } from './OrganizerCalendarCard';
import { PAGE_FILL } from '../layout/PageShell';

/** «/collections» lists all collections; «/collections/:id» opens one. */
export default function CollectionPageContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const [formingOnly, setFormingOnly] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const collection = collectionById(id);
  const today = new Date().toISOString().slice(0, 10);

  const list = useMemo(() => {
    if (!collection) return [];
    return collectionEvents(collection, events, groups)
      .filter((e) => showPast || e.date >= today)
      .filter((e) => !formingOnly || formingGroups(e, groups).length > 0);
  }, [collection, events, groups, formingOnly, showPast, today]);

  usePublishPageSnapshot({
    titleEl: collection ? collection.el : 'Συλλογές',
    titleEn: collection ? collection.en : 'Collections',
    summaryEl: collection ? `${list.length} εκδηλώσεις` : 'Θεματικές συλλογές εκδηλώσεων',
    summaryEn: collection ? `${list.length} events` : 'Themed event collections',
    visibleIds: list.map((e) => e.id),
  });

  if (!id) {
    return (
      <div className={cn(PAGE_FILL, 'space-y-4 pb-20 md:pb-6')}>
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Library className="h-5 w-5" aria-hidden /> {t('Συλλογές', 'Collections')}
        </h1>
        <p className={cn(APP_TYPO.pageSub, 'text-ink-muted')}>
          {t('Διαλεγμένες εκδηλώσεις ανά διάθεση — και πόσες παρέες σχηματίζονται σε καθεμία.', 'Events picked by mood — and how many groups are forming in each.')}
        </p>
        <CollectionsRail title={false} fill />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className={cn(PAGE_FILL, 'py-6')}>
        <EmptyState
          title={t('Η συλλογή δεν βρέθηκε', 'Collection not found')}
          description={t('Ίσως μετακινήθηκε — δες όλες τις συλλογές.', 'It may have moved — see all collections.')}
          actionLabel={t('Όλες οι συλλογές', 'All collections')}
          onAction={() => navigate('/collections')}
        />
      </div>
    );
  }

  const Icon = COLLECTION_ICONS[collection.id as keyof typeof COLLECTION_ICONS] ?? Library;
  const totalForming = list.reduce((n, e) => n + formingGroups(e, groups).length, 0);

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-20 md:pb-6')}>
      <Link to="/collections" className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('Όλες οι συλλογές', 'All collections')}
      </Link>
      <header>
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Icon className="h-5 w-5" aria-hidden /> {t(collection.el, collection.en)}
        </h1>
        <p className={cn(APP_TYPO.pageSub, 'mt-1 text-ink-muted')}>{t(collection.descEl, collection.descEn)}</p>
        <p className="mt-1 text-xs font-bold text-ink" aria-live="polite">
          {t(`${list.length} εκδηλώσεις · ${totalForming} παρέες σχηματίζονται`, `${list.length} events · ${totalForming} groups forming`)}
        </p>
      </header>
      {collection.id === 'nakamas-nights' && (
        <OrganizerCalendarCard organizerId="platform" organizerName="Nakamas" />
      )}
      <div className="flex flex-wrap gap-2">
        <Chip active={formingOnly} onClick={() => setFormingOnly((v) => !v)}>
          {t('Μόνο με παρέα που σχηματίζεται', 'Only with a group forming')}
        </Chip>
        <Chip active={showPast} onClick={() => setShowPast((v) => !v)}>
          {t('Και περασμένες', 'Include past')}
        </Chip>
      </div>
      {list.length === 0 ? (
        <EmptyState
          title={t('Τίποτα εδώ αυτή τη στιγμή', 'Nothing here right now')}
          description={t('Δοκίμασε χωρίς φίλτρα ή δες άλλη συλλογή.', 'Try without filters or see another collection.')}
          actionLabel={formingOnly || !showPast ? t('Δείξε όλες', 'Show all') : t('Άλλη συλλογή', 'Another collection')}
          onAction={() => {
            if (formingOnly || !showPast) {
              setFormingOnly(false);
              setShowPast(true);
            } else {
              navigate('/collections');
            }
          }}
          secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
          onSecondary={() => navigate('/buddy-seek')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
