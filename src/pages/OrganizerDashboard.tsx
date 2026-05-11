import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Calendar, Users, MessageSquare, Plus, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-full space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">{t('Πίνακας Ελέγχου Διοργανωτή', 'Organizer Dashboard')}</h1>
          <p className="mt-1 text-xs text-gray-500 font-medium">{t('Διαχειριστείτε τις καταχωρήσεις, τους συμμετέχοντες και τις ομάδες σας.', 'Manage your listings, attendees, and groups.')}</p>
        </div>
        <Button className="bg-[#111827] text-white flex items-center gap-2 text-xs font-bold px-4 hover:bg-black" onClick={() => navigate('/create-event')}>
          <Plus className="w-4 h-4" />
          {t('Δημιουργία Εκδήλωσης', 'Create Event')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-t-4 border-t-indigo-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{t('Ενεργές Καταχωρήσεις', 'Active Listings')}</h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">3</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-emerald-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{t('Συνολικοί Συμμετέχοντες', 'Total Attendees')}</h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">48</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-amber-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{t('Μη αναγνωσμένα μηνύματα', 'Unread Messages')}</h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">5</p>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide">{t('Οι Επερχόμενες Εκδηλώσεις σας', 'Your Upcoming Events')}</h2>
        
        <Card className="p-0 overflow-hidden border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                 <Badge variant="neutral">{t('14 Μαΐου', 'May 14')}</Badge>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('Επιτραπέζια', 'Boardgames')}</span>
               </div>
               <h3 className="text-sm font-bold text-[#111827]">{t('Βραδιά Επιτραπέζιων: Στρατηγική & Ποτά', 'Board Game Night: Strategy & Drinks')}</h3>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">{t('12/15 Συμμετέχουν', '12/15 Joined')}</span>
            </div>
          </div>
          
          <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Groups Panel */}
             <div className="md:col-span-2 space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <Users className="w-4 h-4 text-gray-400" />
                 {t('Ομάδες Συμμετεχόντων', 'Attendee Groups')}
               </h4>
               
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700">{t('Ομάδα A (Στρατηγικοί)', 'Group A (Strategic)')}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t('5 μέλη • Υψηλή Εμπιστοσύνη', '5 members • High Trust')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white text-indigo-600 rounded shadow-sm border border-gray-200 hover:bg-indigo-50">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700">{t('Ομάδα Β (Χαλαροί)', 'Group B (Casual)')}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t('4 μέλη • Αναμονή', '4 members • Forming')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white text-indigo-600 rounded shadow-sm border border-gray-200 hover:bg-indigo-50">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
             </div>

             {/* Actions */}
             <div className="space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-gray-400" />
                 {t('Ενέργειες', 'Listing Actions')}
               </h4>
               <Button variant="outline" className="w-full text-xs" size="sm" onClick={() => navigate('/create-event?edit=true')}>{t('Επεξεργασία', 'Edit Details')}</Button>
               <Button variant="outline" className="w-full text-xs" size="sm">{t('Μήνυμα σε όλους', 'Message All Attendees')}</Button>
               <Button variant="outline" className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100" size="sm">{t('Είσοδος (Check-in)', 'Check-in Participants')}</Button>
               <Button variant="ghost" className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700" size="sm">{t('Ακύρωση Εκδήλωσης', 'Cancel Event')}</Button>
             </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                 <Badge variant="neutral">{t('5 Ιουν', 'Jun 5')}</Badge>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('Απόδραση', 'Getaway')}</span>
               </div>
               <h3 className="text-sm font-bold text-[#111827]">{t('Απόδραση Σαββατοκύριακου: Αράχωβα', 'Weekend Getaway: Arachova Retreat')}</h3>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100">{t('8/8 Πλήρες', '8/8 Full')}</span>
            </div>
          </div>
          
          <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-2 space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <Users className="w-4 h-4 text-gray-400" />
                 {t('Ομάδες Συμμετεχόντων', 'Attendee Groups')}
               </h4>
               
               <div className="flex items-center justify-between p-3 bg-indigo-50 rounded border border-indigo-100">
                  <div>
                    <p className="text-xs font-bold text-indigo-900">{t('Ομάδα 1 (Πλήρης)', 'Group 1 (Full)')}</p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">{t('8 μέλη • Επιβεβαιωμένη Πληρωμή', '8 members • Confirmed Payment')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white text-indigo-600 rounded shadow-sm border border-indigo-200 hover:bg-indigo-100 relative">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                  </div>
               </div>
             </div>

             <div className="space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <MoreHorizontal className="w-4 h-4 text-gray-400" />
                 {t('Γρήγοροι Σύνδεσμοι', 'Quick Links')}
               </h4>
               <Button variant="outline" className="w-full text-xs" size="sm">{t('Διαχείριση Πληρωμών', 'Manage Payments')}</Button>
               <Button variant="outline" className="w-full text-xs" size="sm">{t('Γρήγορη Υπενθύμιση', 'Send Reminder')}</Button>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
