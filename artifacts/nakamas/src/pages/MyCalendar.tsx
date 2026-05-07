import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import { mockEvents } from '../data/mockEvents';

export default function MyCalendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const upcomingEvents = mockEvents.slice(0, 3).map((e, idx) => ({
    ...e,
    parsedDate: addDays(new Date(), idx * 2)
  }));

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Placeholder for month view days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">My Calendar</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Manage your schedule and upcoming experiences.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${view === 'week' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500'}`}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button 
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${view === 'month' ? 'bg-white shadow-sm text-[#111827]' : 'text-gray-500'}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#111827] text-lg">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
             <button onClick={prevWeek} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
               <ChevronLeft className="w-5 h-5 text-gray-600" />
             </button>
             <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
               Today
             </button>
             <button onClick={nextWeek} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
               <ChevronRight className="w-5 h-5 text-gray-600" />
             </button>
          </div>
        </div>

        {view === 'week' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {days.map((day, i) => (
                <div key={i} className="text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(day, 'EEE')}</div>
                  <div className={`mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-bold ${isToday(day) ? 'bg-indigo-600 text-white' : 'text-[#111827]'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="space-y-3 mt-6">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
                  <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-gray-100 pr-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">{format(event.parsedDate, 'MMM')}</span>
                    <span className="text-2xl font-black text-[#111827]">{format(event.parsedDate, 'dd')}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-[#111827] text-sm">{event.title}</h3>
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Confirmed
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 font-medium">
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
             <div className="text-center py-12 text-sm text-gray-500 font-medium flex flex-col items-center">
               <CalendarIcon className="w-12 h-12 text-gray-300 mb-3" />
               Month view coming soon.
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
