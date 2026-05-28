import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { MessageCircle, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, XCircle, Users, Bookmark } from 'lucide-react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, differenceInHours, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from "../lib/i18n";
import { TabBar } from '../components/common/TabBar';

export default function PlansClassic() {
  const { t } = useLanguage();
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

  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-[16px] md:text-[18px] font-bold text-[#111827]">{t(`Τα Σχέδιά μου`, `My Plans`)}</h1>
        <p className="mt-1 text-[13.551608211075px] text-gray-500 font-medium">{t(`Διαχείριση επερχόμενων, εκκρεμών και παρελθόντων εκδηλώσεων.`, `Manage your upcoming experiences, pending groups, and past events.`)}</p>
      </div>

      {/* Action required prompt */}
      <Card className="!rounded-2xl p-4 !border-amber-200 !bg-amber-50 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#111827] text-[16.75971px] mb-1">{t(`Επαληθεύστε την ταυτότητά σας`, `Verify your identity`)}</h3>
            <p className="text-[14.535px] text-amber-800 font-medium">{t(`Πρέπει να ολοκληρώσετε την επαλήθευση για να συμμετάσχετε στο "Arachova Retreat".`, `You need to complete ID verification to join the "Arachova Retreat" you expressed interest in.`)}</p>
          </div>
        </div>
        <button onClick={() => navigate('/trust')} className="bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-[13.5px] font-bold shadow-soft hover:bg-amber-700 transition-all duration-200 whitespace-nowrap shrink-0">
          {t(`Επαλήθευση`, `Verify Now`)}
        </button>
      </Card>

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
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 !border-[#a5f3fc]/40 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-[#0E8B8D] text-white px-2.5 py-0.5 rounded-full text-[11.25px] font-bold tracking-wide">
                {t(`Επιβεβαιωμένο`, `Confirmed`)}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-[20px] text-[#111827]">{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className="text-[18px] font-bold text-gray-900">{format(parseISO(event.date), 'MMM d')}</div>
                  <div className="text-[14.85px] font-medium text-gray-500">{event.time}</div>
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

              {/* Group members preview */}
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
                <button onClick={() => navigate(`/chat/${event.id}`)} className="flex-1 btn-gradient !py-2 flex items-center justify-center gap-1.5 !text-[13.5px]">
                  <MessageCircle className="h-4 w-4" /> {t(`Ομαδική Συνομιλία`, `Group Chat`)}
                </button>
                <button onClick={() => navigate(`/events/${event.id}`)} className="bg-white border-2 border-gray-100 hover:border-[#a5f3fc] hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-2xl text-[13.5px] font-bold transition-all duration-200">
                  {t(`Λεπτομέρειες`, `Details`)}
                </button>
                <button
                  onClick={() => setShowLeaveConfirm(event.id)}
                  className="bg-white border-2 border-red-100 hover:bg-red-50 text-red-500 px-3 py-2 rounded-2xl text-[13.5px] font-bold transition-all duration-200 flex items-center gap-1"
                >
                  <XCircle className="h-3.5 w-3.5" /> {t(`Αποχώρηση`, `Leave`)}
                </button>
              </div>
            </div>
          </Card>
        ))}
        
        {upcomingEvents.length === 0 && (
          <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium text-[18px] mb-4">{t(`Δεν υπάρχουν επερχόμενα σχέδια.`, `No upcoming confirmed plans.`)}</p>
            <button className="btn-gradient" onClick={() => navigate('/')}>{t(`Εξερεύνηση`, `Explore Experiences`)}</button>
          </div>
        )}
      </div>
      )}

      {activeTab === 'pending' && (
      <div className="space-y-4">
        {pendingEvents.map(event => (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 opacity-75 hover:opacity-100 transition-all duration-200 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative grayscale">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-gray-800 text-white px-2.5 py-0.5 rounded-full text-[11.25px] font-bold tracking-wide">
                {t(`Εκκρεμής Ομάδα`, `Pending Group`)}
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-[20px] text-[#111827] opacity-80">{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className="text-[18px] font-bold text-gray-900">{format(parseISO(event.date), 'MMM d')}</div>
                </div>
              </div>
              
              <p className="text-[13.5px] text-gray-500 font-medium mb-4">
                {t(`Εκδηλώσατε ενδιαφέρον. Αναμονή για 2 ακόμα άτομα για να επιβεβαιωθεί η ομάδα.`, `You expressed interest. Waiting for 2 more people to confirm the group and unlock the meeting point.`)}
              </p>

              <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                <button onClick={() => navigate(`/events/${event.id}`)} className="bg-white border-2 border-gray-100 hover:border-[#a5f3fc] hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-2xl text-[13.5px] font-bold transition-all duration-200">
                  {t(`Κατάσταση`, `View Status`)}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {activeTab === 'past' && (
      <div className="space-y-4">
        {pastEvents.map((event, index) => (
          <Card key={event.id} className="!rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1.5 text-[13.5px] font-bold text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {format(parseISO(event.date), 'MMMM d, yyyy')}
              </div>
              <h3 className="font-bold text-[20px] text-[#111827] mb-3">{event.title}</h3>
              
              {!feedbackSubmitted[event.id] ? (
                <div className="bg-[#18D8DB]/[0.04] border border-[#a5f3fc]/40 p-3 rounded-2xl flex items-center justify-between mt-auto">
                  <div className="text-[13.5px] font-bold text-[#0E8B8D]">{t(`Απαιτείται αξιολόγηση`, `Feedback required`)}</div>
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
      </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-in fade-in duration-200">
          <div className="modal-panel max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#111827] mb-2">{t('Αποχώρηση από ομάδα', 'Leave Group')}</h3>
            <p className="text-xs font-medium text-gray-500 mb-6">
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
                className="w-full px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all duration-200 border border-gray-100"
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

