import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { MessageCircle, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Users, Bookmark } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, differenceInHours, isBefore } from 'date-fns';
import { useLanguage } from "../lib/i18n";
import { toast } from 'sonner';

export default function PlansClassic() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const [leaveConfirmEventId, setLeaveConfirmEventId] = useState<string | null>(null);
  const navigate = useNavigate();

  const events = useStore(state => state.events);
  const groups = useStore(state => state.groups);
  const currentUser = useStore(state => state.currentUser);
  const waitlistedEvents = useStore(state => state.waitlistedEvents);
  const feedbackSubmitted = useStore(state => state.feedbackSubmitted);
  const leaveGroup = useStore(state => state.leaveGroup);

  const today = new Date();

  const myGroupEventIds = groups
    .filter(g => currentUser && g.members.includes(currentUser.id))
    .map(g => g.eventId);

  const upcomingEvents = events.filter(
    e => myGroupEventIds.includes(e.id) && !isBefore(parseISO(e.date), today)
  );
  const pendingEvents = events.filter(e => waitlistedEvents.includes(e.id));
  const pastEvents = events.filter(e => isBefore(parseISO(e.date), today)).slice(0, 5);

  const needsVerification =
    currentUser &&
    currentUser.trustTier === '1_explorer' &&
    !currentUser.idVerified;

  const handleLeaveConfirm = (eventId: string) => {
    const group = groups.find(
      g => g.eventId === eventId && currentUser && g.members.includes(currentUser.id)
    );
    if (group) {
      leaveGroup(group.id);
      toast.success(t('Αποχωρήσατε από την εκδήλωση', 'You have left the event'));
    }
    setLeaveConfirmEventId(null);
  };

  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-[22.33807213275px] md:text-[26.7902365993px] font-bold text-[#111827]">{t(`Τα Σχέδιά μου`, `My Plans`)}</h1>
        <p className="mt-1 text-[13.551608211075px] text-gray-500 font-medium">{t(`Διαχείριση επερχόμενων, εκκρεμών και παρελθόντων εκδηλώσεων.`, `Manage your upcoming experiences, pending groups, and past events.`)}</p>
      </div>

      {needsVerification && (
        <Card className="rounded-xl p-4 border border-amber-200 bg-amber-50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#111827] text-[16.75971px] mb-1">{t(`Επαληθεύστε την ταυτότητά σας`, `Verify your identity`)}</h3>
              <p className="text-[14.535px] text-amber-800 font-medium">{t(`Πρέπει να ολοκληρώσετε την επαλήθευση για να συμμετάσχετε σε εκδηλώσεις επιπέδου.`, `Complete ID verification to join higher-tier events.`)}</p>
            </div>
          </div>
          <button onClick={() => navigate('/trust')} className="bg-amber-600 text-white px-4 py-2 rounded-full text-[14.2457535px] font-bold shadow-sm hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0 snap-center">
            {t(`Επαλήθευση`, `Verify Now`)}
          </button>
        </Card>
      )}

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto noscrollbar">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-[12.1125px] font-bold tracking-wide transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'upcoming' ? 'border-b-2 border-cyan-600 text-cyan-900' : 'text-gray-500 hover:text-[#111827]'}`}
        >
          {t(`Επερχόμενα`, `Upcoming Confirmed`)}
          {upcomingEvents.length > 0 && (
            <span className="bg-cyan-100 text-cyan-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{upcomingEvents.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-[12.1125px] font-bold tracking-wide transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'pending' ? 'border-b-2 border-cyan-600 text-cyan-900' : 'text-gray-500 hover:text-[#111827]'}`}
        >
          {t(`Εκκρεμή`, `Pending & Waitlists`)}
          {pendingEvents.length > 0 && (
            <span className="bg-cyan-100 text-cyan-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingEvents.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-[12.1125px] font-bold tracking-wide transition-colors whitespace-nowrap ${activeTab === 'past' ? 'border-b-2 border-cyan-600 text-cyan-900' : 'text-gray-500 hover:text-[#111827]'}`}
        >
          {t(`Ιστορικό`, `Past & Feedback`)}
        </button>
      </div>

      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingEvents.map(event => (
            <Card key={event.id} className="rounded-xl p-4 sm:p-5 border border-cyan-100 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-cyan-600 text-white px-2 py-0.5 rounded text-[11.25px] font-bold tracking-wide">
                  {t(`Επιβεβαιωμένο`, `Confirmed`)}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-[15px] text-[#111827]">{event.title}</h3>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-bold text-gray-900">{format(parseISO(event.date), 'MMM d')}</div>
                    <div className="text-[13px] font-medium text-gray-500">{event.time}</div>
                    {(() => {
                      const days = differenceInDays(parseISO(event.date), new Date());
                      const hours = differenceInHours(parseISO(event.date), new Date());
                      if (days <= 0 && hours > 0) return <span className="text-[11.2px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">{t(`σε`, `in`)} {hours}h</span>;
                      if (days > 0 && days <= 7) return <span className="text-[11.2px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">{t(`σε`, `in`)} {days} {t(`μέρες`, `days`)}</span>;
                      return null;
                    })()}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                  <div className="flex items-center text-[13.5px] text-gray-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 mr-1" /> {t(`Σημείο συνάντησης ενεργό`, `Meeting point active`)}
                  </div>
                  <div className="flex items-center text-[13.5px] text-gray-600 font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1" /> {event.duration}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex -space-x-2">
                    {['https://i.pravatar.cc/24?u=p1', 'https://i.pravatar.cc/24?u=p2', 'https://i.pravatar.cc/24?u=p3'].map((url, i) => (
                      <img key={i} src={url} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                    ))}
                  </div>
                  <span className="text-[11.25px] font-medium text-gray-500 flex items-center gap-0.5">
                    <Users className="w-3 h-3" /> 4/5 {t(`μέλη`, `members`)}
                  </span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => navigate(`/chat/${event.id}`)} className="flex-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 py-2 rounded-lg text-[13.5px] font-bold transition-colors flex items-center justify-center gap-1.5">
                    <MessageCircle className="h-4 w-4" /> {t(`Ομαδική Συνομιλία`, `Group Chat`)}
                  </button>
                  <button onClick={() => navigate(`/events/${event.id}`)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13.5px] font-bold transition-colors">
                    {t(`Λεπτομέρειες`, `Details`)}
                  </button>
                  <button
                    onClick={() => setLeaveConfirmEventId(event.id)}
                    className="bg-white border border-red-200 hover:bg-red-50 text-red-500 px-3 py-2 rounded-lg text-[13.5px] font-bold transition-colors flex items-center gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5" /> {t(`Αποχώρηση`, `Leave`)}
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {upcomingEvents.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium text-[15px] mb-4">{t(`Δεν υπάρχουν επερχόμενα σχέδια.`, `No upcoming confirmed plans.`)}</p>
              <button className="bg-[#111827] text-white px-5 py-2 rounded-full text-[13.5px] font-bold" onClick={() => navigate('/')}>{t(`Εξερεύνηση`, `Explore Experiences`)}</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingEvents.length > 0 ? pendingEvents.map(event => (
            <Card key={event.id} className="rounded-xl p-4 sm:p-5 border border-gray-200 flex flex-col sm:flex-row gap-4 opacity-75 hover:opacity-100 transition-opacity">
              <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative grayscale">
                <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-0.5 rounded text-[11.25px] font-bold tracking-wide">
                  {t(`Λίστα Αναμονής`, `Waitlist`)}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-[15px] text-[#111827] opacity-80">{event.title}</h3>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-bold text-gray-900">{format(parseISO(event.date), 'MMM d')}</div>
                  </div>
                </div>

                <p className="text-[13.5px] text-gray-500 font-medium mb-4">
                  {t(`Είστε στη λίστα αναμονής. Αναμονή για επιβεβαίωση της ομάδας.`, `You're on the waitlist. Waiting for group confirmation.`)}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                  <button onClick={() => navigate(`/events/${event.id}`)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13.5px] font-bold transition-colors">
                    {t(`Κατάσταση`, `View Status`)}
                  </button>
                </div>
              </div>
            </Card>
          )) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <Bookmark className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-[#111827] mb-1">{t(`Δεν υπάρχουν εκκρεμείς εκδηλώσεις`, `No pending events`)}</h3>
              <p className="text-sm text-gray-500 mb-4">{t(`Εκδηλώστε ενδιαφέρον σε εκδηλώσεις για να εμφανιστούν εδώ.`, `Express interest in events to see them here.`)}</p>
              <button className="bg-[#111827] text-white px-5 py-2 rounded-full text-[13.5px] font-bold" onClick={() => navigate('/')}>{t(`Εξερεύνηση`, `Explore Experiences`)}</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastEvents.length > 0 ? pastEvents.map((event) => {
            const hasFeedback = !!feedbackSubmitted[event.id];
            return (
              <Card key={event.id} className="rounded-xl p-4 sm:p-5 border border-gray-200 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-1.5 text-[13.5px] font-bold text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(event.date), 'MMMM d, yyyy')}
                  </div>
                  <h3 className="font-bold text-[15px] text-[#111827] mb-3">{event.title}</h3>

                  {!hasFeedback ? (
                    <div className="bg-cyan-50 border border-cyan-100 p-3 rounded-lg flex items-center justify-between mt-auto">
                      <div className="text-[13.5px] font-bold text-cyan-900">{t(`Απαιτείται αξιολόγηση`, `Feedback required`)}</div>
                      <button onClick={() => navigate(`/history/feedback/${event.id}`)} className="text-[11.25px] font-bold bg-cyan-600 text-white px-3 py-1.5 rounded hover:bg-cyan-700 tracking-wide">
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
            );
          }) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium text-sm">{t(`Δεν υπάρχουν παρελθόντα σχέδια ακόμα.`, `No past events yet.`)}</p>
            </div>
          )}
        </div>
      )}

      {leaveConfirmEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#111827]">{t(`Αποχώρηση από εκδήλωση;`, `Leave this event?`)}</h3>
            <p className="text-[13.5px] text-gray-500 font-medium">{t(`Η θέση σας θα ελευθερωθεί και η ομάδα σας θα ειδοποιηθεί.`, `Your spot will be freed and your group will be notified.`)}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setLeaveConfirmEventId(null)}>
                {t(`Ακύρωση`, `Cancel`)}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleLeaveConfirm(leaveConfirmEventId)}
              >
                {t(`Αποχώρηση`, `Leave`)}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
