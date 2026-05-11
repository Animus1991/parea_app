import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, Clock3, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { mockEvents } from '../data/mockEvents';
import { useLanguage } from "../lib/i18n";

export default function MyCalendar() {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const upcomingEvents = mockEvents.slice(0, 3).map((e, idx) => ({
    ...e,
    parsedDate: addDays(new Date(), idx * 2)
  }));

  const prevPeriod = () => {
    if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };
  const nextPeriod = () => {
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart) === 0 ? 6 : getDay(monthStart) - 1;

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20.1244649994475px] md:text-[26.7902365993px] font-bold text-[#111827]">{t(`Το Ημερολόγιό μου`, `My Calendar`)}</h1>
          <p className="text-gray-500 font-medium text-[13.55510121105px] md:text-[14.626916949961px] mt-1">{t(`Οι επερχόμενες εκδηλώσεις σας`, `Your upcoming events`)}</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-1.5 rounded-md text-[14.2457535px] font-bold transition-colors ${view === 'week' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500'}`}
            onClick={() => setView('week')}
          >{t(`Εβδομάδα`, `Week`)}</button>
          <button 
            className={`px-4 py-1.5 rounded-md text-[14.2457535px] font-bold transition-colors ${view === 'month' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500'}`}
            onClick={() => setView('month')}
          >{t(`Μήνας`, `Month`)}</button>
        </div>
      </div>

      {/* Next event countdown */}
      {upcomingEvents.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-50 to-purple-50 border border-cyan-100 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-700" />
            </div>
            <div>
              <p className="text-[12.1125px] font-bold text-gray-500 uppercase tracking-wider">{t(`Επόμενη εκδήλωση`, `Next event`)}</p>
              <p className="text-[14.535px] font-bold text-[#111827]">{upcomingEvents[0].title}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[16.56547605484px] font-black text-cyan-700">{t(`σε`, `in`)} 2 {t(`ημέρες`, `days`)}</p>
            <p className="text-[13.233495595550108784px] text-gray-500 font-medium">{upcomingEvents[0].time}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-[#111827] text-[20.731614957278874px]">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
             <button onClick={prevPeriod} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
               <ChevronLeft className="w-5 h-5 text-gray-600" />
             </button>
             <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-[14.2457535px] font-bold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">{t(`Σήμερα`, `Today`)}</button>
             <button onClick={nextPeriod} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
               <ChevronRight className="w-5 h-5 text-gray-600" />
             </button>
          </div>
        </div>

        {view === 'week' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {days.map((day, i) => (
                <div key={i} className="text-center">
                  <div className="text-[11.87146125px] font-bold text-gray-400 uppercase tracking-wider">{format(day, 'EEE')}</div>
                  <div className={`mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-[17.0949042px] font-bold ${isToday(day) ? 'bg-cyan-600 text-white' : 'text-[#111827]'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mt-6">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-cyan-100 hover:bg-cyan-50/30 transition-colors cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}><div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-gray-100 pr-4">
                    <span className="text-[13.966425px] font-bold text-gray-400 uppercase">{format(event.parsedDate, 'MMM')}</span>
                    <span className="text-[27.91285px] font-black text-[#111827]">{format(event.parsedDate, 'dd')}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[#111827] text-[16.75971px]">{event.title}</h3>
                      <span className="flex items-center gap-1 text-[11.87146125px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />{t(`Επιβεβαιωμένο`, `Confirmed`)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[13.5px] text-gray-500 font-medium">
                      <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.time}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.locationArea}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {view === 'month' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {[t(`Δευ`,`Mon`), t(`Τρί`,`Tue`), t(`Τετ`,`Wed`), t(`Πέμ`,`Thu`), t(`Παρ`,`Fri`), t(`Σάβ`,`Sat`), t(`Κυρ`,`Sun`)].map(d => (
                <div key={d} className="text-center text-[10.64px] font-bold text-gray-400 uppercase tracking-widest py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }).map((_, i) => (
                <div key={`blank-${i}`} className="aspect-square" />
              ))}
              {monthDays.map(day => {
                const dayEvents = upcomingEvents.filter(e => isSameDay(e.parsedDate, day));
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <div
                    key={day.toISOString()}
                    className={`aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors ${
                      isToday(day) ? 'bg-cyan-600 text-white'
                        : dayEvents.length > 0 ? 'bg-cyan-50 hover:bg-cyan-100'
                        : 'hover:bg-gray-50'
                    } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    <span className={`text-[13.11px] font-bold ${isToday(day) ? 'text-white' : 'text-[#111827]'}`}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isToday(day) ? 'bg-white' : 'bg-cyan-600'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            {upcomingEvents.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                <h4 className="text-[11.2px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t(`Αυτό τον μήνα`, `This Month`)}</h4>
                {upcomingEvents.map((event, idx) => (
                  <div key={idx} className="flex gap-3 items-center text-[17.1px] cursor-pointer hover:bg-cyan-50 p-2 rounded-lg transition-colors" onClick={() => navigate(`/events/${event.id}`)}>
                    <div className="text-[10.64px] font-bold text-gray-400 uppercase w-12 shrink-0">{format(event.parsedDate, 'MMM d')}</div>
                    <div className="w-2 h-2 rounded-full bg-cyan-600 shrink-0" />
                    <div className="font-medium text-[#111827] text-[12.55px] line-clamp-1 flex-1">{event.title}</div>
                    <span className="text-[10.64px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">{t(`Επιβεβ.`, `Confirmed`)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}