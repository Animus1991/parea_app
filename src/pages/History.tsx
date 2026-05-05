import React from 'react';
import { History as HistoryIcon, MapPin, Calendar, Clock, Star, MessageSquare } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const pastEvents = mockEvents.slice(0, 3); // Just using some mock data for display
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Past History</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Events and experiences you have attended.</p>
        </div>
      </div>

      <div className="space-y-4">
        {pastEvents.map((event, index) => (
          <div key={event.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-[10px] font-bold uppercase tracking-wider">
                  {index === 0 ? 'Yesterday' : 'Last Week'}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-[#111827] line-clamp-2">{event.title}</h3>
                </div>
                
                <div className="mt-2 space-y-1.5 flex-1">
                  <div className="flex items-center text-xs text-gray-500 font-medium tracking-wide">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    {format(parseISO(event.date), 'MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 font-medium tracking-wide">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    {event.locationArea}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/history/feedback/${event.id}`)} className="flex items-center gap-1.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors uppercase tracking-wider">
                      <Star className="w-3 h-3" />
                      Rate & Review
                    </button>
                  </div>
                  <button className="text-[10px] font-bold text-gray-500 hover:text-[#111827] uppercase tracking-wider transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center pt-6 pb-2">
         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">End of History</p>
      </div>
    </div>
  );
}
