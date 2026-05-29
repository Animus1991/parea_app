import { useState } from 'react';
import { Card } from '../components/common/Card';
import { MessageCircle, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Users, CalendarClock, CalendarCheck, Compass } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, differenceInHours, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from "../lib/i18n";
import { usePageContrast } from '../hooks/usePageContrast';
import { TabBar } from '../components/common/TabBar';
import { cn } from '../lib/utils';

export default function PlansClassic() {
  const { t } = useLanguage();
  const p = usePageContrast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState<string | null>(null);
  const navigate = useNavigate();

  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const currentUser = useStore((s) => s.currentUser);
  const waitlistedEvents = useStore((s) => s.waitlistedEvents);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const leaveGroup = useStore((s) => s.leaveGroup);

  const now = new Date();
  const userGroupEventIds = currentUser
    ? groups.filter(g => g.members.includes(currentUser.id)).map(g => g.eventId)
    : [];

  const upcomingEvents = events.filter(e => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && !isBefore(d, now) && userGroupEventIds.includes(e.id);
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pendingEvents = events.filter(e => waitlistedEvents.includes(e.id) && !userGroupEventIds.includes(e.id));

  const pastEvents = events.filter(e => {
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && isBefore(d, now) && userGroupEventIds.includes(e.id);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const needsRating = pastEvents.filter(e => !feedbackSubmitted[e.id]).length;
  const nextEvent = upcomingEvents[0];
  const nextEventDays = nextEvent ? differenceInDays(parseISO(nextEvent.date), now) : null;
  const showVerifyBanner = currentUser ? !currentUser.idVerified : false;

  const stats: { id: 'upcoming' | 'pending' | 'past'; label: string; count: number; icon: typeof Calendar }[] = [
    { id: 'upcoming', label: t('Επερχόμενα', 'Upcoming'), count: upcomingEvents.length, icon: CalendarClock },
    { id: 'pending', label: t('Εκκρεμή', 'Pending'), count: pendingEvents.length, icon: Clock },
    { id: 'past', label: t('Ολοκληρωμένα', 'Completed'), count: pastEvents.length, icon: CalendarCheck },
  ];

  const secondaryBtn = cn(
    'px-4 py-2 rounded-2xl text-[13.5px] font-bold transition-all duration-200 border-2',
    p.isDark
      ? 'border-white/10 hover:border-white/25 text-gray-100 hover:bg-white/5'
      : 'border-gray-100 hover:border-[#a5f3fc] hover:bg-gray-50 text-gray-700',
  );

  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-7 pb-20 md:pb-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className={cn('text-[16px] md:text-[18px] font-bold', p.head)}>{t(`Τα Σχέδιά μου`, `My Plans`)}</h1>
        <p className={cn('mt-1 text-[13.5px] font-medium', p.sub)}>{t(`Διαχείριση επερχόμενων, εκκρεμών και παρελθόντων εκδηλώσεων.`, `Manage your upcoming experiences, pending groups, and past events.`)}</p>
      </div>

      {/* Summary stats — also act as quick tab switches */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={cn(
              'rounded-2xl p-3 sm:p-4 text-left border transition-all duration-200',
              p.cardSurface,
              activeTab === s.id ? `${p.statBg} ring-1 ring-inset ${p.ring.replace('focus:', '')}` : p.borderB,
              p.cardHover,
            )}
          >
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', p.statBg)}>
              <s.icon className={cn('w-5 h-5', p.statVal)} />
            </div>
            <p className={cn('text-2xl font-black tabular-nums leading-none', p.head)}>{s.count}</p>
            <p className={cn('text-[11px] font-semibold mt-1', p.muted)}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Next-event highlight */}
      {nextEvent && nextEventDays !== null && nextEventDays <= 7 && (
        <Card className={cn('!rounded-2xl p-4 flex items-center gap-3', p.highlightRow)}>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', p.statBg)}>
            <CalendarClock className={cn('w-5 h-5', p.statVal)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-[11px] font-bold uppercase tracking-wide', p.muted)}>{t('Επόμενη εκδήλωση', 'Next up')}</p>
            <p className={cn('font-bold text-[15px] truncate', p.head)}>{nextEvent.title}</p>
          </div>
          <span className={cn('shrink-0 text-[12px] font-bold px-2.5 py-1 rounded-full', p.statBg, p.statVal)}>
            {nextEventDays <= 0 ? t('Σήμερα', 'Today') : `${t('σε', 'in')} ${nextEventDays}${t('μ', 'd')}`}
          </span>
        </Card>
      )}

      {/* Action required prompt — only when ID is not yet verified */}
      {showVerifyBanner && (
        <Card className={cn(
          '!rounded-2xl p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4',
          p.isDark ? '!bg-amber-500/10 !border-amber-500/30' : '!bg-amber-50 !border-amber-200',
        )}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={cn('w-5 h-5 shrink-0 mt-0.5', p.isDark ? 'text-amber-400' : 'text-amber-600')} />
            <div>
              <h3 className={cn('font-bold text-[15.5px] mb-1', p.isDark ? 'text-amber-200' : 'text-amber-900')}>{t(`Επαληθεύστε την ταυτότητά σας`, `Verify your identity`)}</h3>
              <p className={cn('text-[13.5px] font-medium', p.isDark ? 'text-amber-200/80' : 'text-amber-800')}>{t(`Ολοκληρώστε την επαλήθευση ταυτότητας για να ξεκλειδώσετε όλες τις εκδηλώσεις και τα σημεία συνάντησης.`, `Complete ID verification to unlock all events and meeting points.`)}</p>
            </div>
          </div>
          <button onClick={() => navigate('/trust')} className="bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-[13.5px] font-bold shadow-soft hover:bg-amber-700 transition-all duration-200 whitespace-nowrap shrink-0">
            {t(`Επαλήθευση`, `Verify Now`)}
          </button>
        </Card>
      )}

      <TabBar
        tabs={[
          { id: 'upcoming', label: t('Επερχόμενα', 'Upcoming'), count: upcomingEvents.length },
          { id: 'pending', label: t('Εκκρεμή', 'Pending'), count: pendingEvents.length },
          { id: 'past', label: t('Ιστορικό', 'Past'), count: pastEvents.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'upcoming' | 'pending' | 'past')}
      />

      {activeTab === 'upcoming' && (
      <div className="space-y-4">
        {upcomingEvents.map(event => (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-[#0E8B8D] text-white px-2.5 py-0.5 rounded-full text-[11.25px] font-bold tracking-wide">
                {t(`Επιβεβαιωμένο`, `Confirmed`)}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className={cn('font-bold text-[20px]', p.head)}>{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className={cn('text-[18px] font-bold', p.head)}>{format(parseISO(event.date), 'MMM d')}</div>
                  <div className={cn('text-[14.85px] font-medium', p.muted)}>{event.time}</div>
                  {(() => {
                    const days = differenceInDays(parseISO(event.date), new Date());
                    const hours = differenceInHours(parseISO(event.date), new Date());
                    if (days <= 0 && hours > 0) return <span className="text-[11.2px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">{t(`σε`, `in`)} {hours}h</span>;
                    if (days > 0 && days <= 7) return <span className={cn('text-[11.2px] font-bold px-1.5 py-0.5 rounded mt-0.5 inline-block', p.statBg, p.statVal)}>{t(`σε`, `in`)} {days} {t(`μέρες`, `days`)}</span>;
                    return null;
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                <div className={cn('flex items-center text-[13.5px] font-medium', p.body)}>
                  <MapPin className="w-3.5 h-3.5 mr-1" /> {t(`Σημείο συνάντησης ενεργό`, `Meeting point active`)}
                </div>
                <div className={cn('flex items-center text-[13.5px] font-medium', p.body)}>
                  <Clock className="w-3.5 h-3.5 mr-1" /> {event.duration}
                </div>
              </div>

              {/* Group members preview */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex -space-x-2">
                  {['https://i.pravatar.cc/24?u=p1', 'https://i.pravatar.cc/24?u=p2', 'https://i.pravatar.cc/24?u=p3'].map((url, i) => (
                    <img key={i} src={url} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
                <span className={cn('text-[11.25px] font-medium flex items-center gap-0.5', p.muted)}>
                  <Users className="w-3 h-3" /> 4/5 {t(`μέλη`, `members`)}
                </span>
              </div>

              <div className={cn('mt-auto pt-4 border-t flex gap-2', p.borderT)}>
                <button onClick={() => navigate(`/chat/${event.id}`)} className="flex-1 btn-gradient !py-2 flex items-center justify-center gap-1.5 !text-[13.5px]">
                  <MessageCircle className="h-4 w-4" /> {t(`Ομαδική Συνομιλία`, `Group Chat`)}
                </button>
                <button onClick={() => navigate(`/events/${event.id}`)} className={secondaryBtn}>
                  {t(`Λεπτομέρειες`, `Details`)}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(event.id)}
                  className={cn(
                    'px-3 py-2 rounded-2xl text-[13.5px] font-bold transition-all duration-200 flex items-center gap-1 border-2',
                    p.isDark ? 'border-red-500/30 hover:bg-red-500/10 text-red-400' : 'border-red-100 hover:bg-red-50 text-red-500',
                  )}
                >
                  <XCircle className="h-3.5 w-3.5" /> {t(`Αποχώρηση`, `Leave`)}
                </button>
              </div>
            </div>
          </Card>
        ))}

        {upcomingEvents.length === 0 && (
          <EmptyTab
            icon={Compass}
            title={t(`Δεν υπάρχουν επερχόμενα σχέδια.`, `No upcoming confirmed plans.`)}
            hint={t('Εξερευνήστε εκδηλώσεις και μπείτε σε μια ομάδα για να ξεκινήσετε.', 'Explore experiences and join a group to get started.')}
            ctaLabel={t(`Εξερεύνηση`, `Explore Experiences`)}
            onCta={() => navigate('/')}
            p={p}
          />
        )}
      </div>
      )}

      {activeTab === 'pending' && (
      <div className="space-y-4">
        {pendingEvents.map(event => (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 opacity-80 hover:opacity-100 transition-all duration-200 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative grayscale">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-gray-800 text-white px-2.5 py-0.5 rounded-full text-[11.25px] font-bold tracking-wide">
                {t(`Εκκρεμής Ομάδα`, `Pending Group`)}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className={cn('font-bold text-[20px]', p.head)}>{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className={cn('text-[18px] font-bold', p.head)}>{format(parseISO(event.date), 'MMM d')}</div>
                </div>
              </div>

              <p className={cn('text-[13.5px] font-medium mb-4', p.sub)}>
                {t(`Εκδηλώσατε ενδιαφέρον. Αναμονή για 2 ακόμα άτομα για να επιβεβαιωθεί η ομάδα.`, `You expressed interest. Waiting for 2 more people to confirm the group and unlock the meeting point.`)}
              </p>

              <div className={cn('mt-auto pt-4 border-t flex gap-2', p.borderT)}>
                <button onClick={() => navigate(`/events/${event.id}`)} className={secondaryBtn}>
                  {t(`Κατάσταση`, `View Status`)}
                </button>
              </div>
            </div>
          </Card>
        ))}

        {pendingEvents.length === 0 && (
          <EmptyTab
            icon={Clock}
            title={t('Καμία εκκρεμής ομάδα.', 'No pending groups.')}
            hint={t('Όταν εκδηλώσετε ενδιαφέρον για μια εκδήλωση, θα εμφανιστεί εδώ μέχρι να επιβεβαιωθεί η ομάδα.', 'When you express interest in an event, it appears here until the group is confirmed.')}
            ctaLabel={t('Ανακάλυψη', 'Discover')}
            onCta={() => navigate('/')}
            p={p}
          />
        )}
      </div>
      )}

      {activeTab === 'past' && (
      <div className="space-y-4">
        {needsRating > 0 && (
          <div className={cn('text-[12.5px] font-semibold flex items-center gap-1.5', p.muted)}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {t(`${needsRating} εκδηλώσεις περιμένουν την αξιολόγησή σας`, `${needsRating} event(s) awaiting your feedback`)}
          </div>
        )}
        {pastEvents.map((event) => (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <div className={cn('flex items-center gap-2 mb-1.5 text-[13.5px] font-bold', p.muted)}>
                <Calendar className="w-3.5 h-3.5" />
                {format(parseISO(event.date), 'MMMM d, yyyy')}
              </div>
              <h3 className={cn('font-bold text-[20px] mb-3', p.head)}>{event.title}</h3>

              {!feedbackSubmitted[event.id] ? (
                <div className={cn('p-3 rounded-2xl flex items-center justify-between mt-auto border', p.statBg)}>
                  <div className={cn('text-[13.5px] font-bold', p.statVal)}>{t(`Απαιτείται αξιολόγηση`, `Feedback required`)}</div>
                  <button onClick={() => navigate(`/history/feedback/${event.id}`)} className="btn-gradient !py-1.5 !px-4 !text-[11.5px]">
                    {t(`Αξιολόγηση`, `Rate Experience`)}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-auto text-[13.5px] font-bold text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> {t(`Αξιολόγηση υποβλήθηκε`, `Feedback submitted`)}
                </div>
              )}
            </div>
          </Card>
        ))}

        {pastEvents.length === 0 && (
          <EmptyTab
            icon={CalendarCheck}
            title={t('Κανένα ολοκληρωμένο σχέδιο ακόμα.', 'No completed plans yet.')}
            hint={t('Οι εκδηλώσεις που παρακολουθήσατε θα εμφανίζονται εδώ για αξιολόγηση και ιστορικό.', 'Events you attend will appear here for ratings and history.')}
            p={p}
          />
        )}
      </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
          <div className="modal-panel max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <h3 className={cn('text-lg font-bold mb-2', p.head)}>{t('Αποχώρηση από ομάδα', 'Leave Group')}</h3>
            <p className={cn('text-xs font-medium mb-6', p.sub)}>
              {t('Είστε σίγουροι ότι θέλετε να αποχωρήσετε; Μπορεί να μην μπορέσετε να ξαναμπείτε.', 'Are you sure you want to leave? You might not be able to rejoin.')}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  const group = groups.find(g => g.eventId === showLeaveConfirm);
                  if (group) leaveGroup(group.id);
                  toast.info(t('Αποχωρήσατε από την ομάδα.', 'You have left the group.'));
                  setShowLeaveConfirm(null);
                }}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all duration-200 shadow-soft"
              >
                {t('Ναι, Αποχώρηση', 'Yes, Leave')}
              </button>
              <button
                onClick={() => setShowLeaveConfirm(null)}
                className={cn('w-full px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200 border', secondaryBtn)}
              >
                {t('Ακύρωση', 'Cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  title,
  hint,
  ctaLabel,
  onCta,
  p,
}: {
  icon: typeof Calendar;
  title: string;
  hint: string;
  ctaLabel?: string;
  onCta?: () => void;
  p: ReturnType<typeof usePageContrast>;
}) {
  return (
    <div className={cn('text-center py-12 px-6 rounded-2xl border border-dashed', p.cardSurface, p.borderB)}>
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3', p.statBg)}>
        <Icon className={cn('w-6 h-6', p.statVal)} />
      </div>
      <p className={cn('font-bold text-[16px]', p.head)}>{title}</p>
      <p className={cn('text-[13px] font-medium mt-1 max-w-sm mx-auto', p.muted)}>{hint}</p>
      {ctaLabel && onCta && (
        <button className="btn-gradient mt-4" onClick={onCta}>{ctaLabel}</button>
      )}
    </div>
  );
}
