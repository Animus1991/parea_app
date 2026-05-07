import React, { useState } from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Calendar, Hash, Bookmark, CalendarPlus, Users, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../../data/mockUsers';

interface EventCardProps {
  event: any; // We'll keep it any or use the type from mockEvents
  key?: React.Key;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  const organizer = mockUsers.find(u => u.id === event.organizerId);

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const getCalendarUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.exactLocation || event.locationArea || '');
    const dateStr = event.date.replace(/-/g, '');
    const timeStr = event.time ? event.time.replace(':', '') + '00' : '000000';
    
    // Default duration of 2 hours if not specified
    let endHour = parseInt(event.time ? event.time.split(':')[0] : '0') + 2;
    if (endHour >= 24) endHour = endHour - 24;
    const endHourStr = endHour.toString().padStart(2, '0');
    const minStr = event.time ? event.time.split(':')[1] : '00';
    const endTimeStr = `${endHourStr}${minStr}00`;
    
    // Add timezone if you like, but Google handles locale cleanly without Z sometimes, or use +02:00? Google Cal format uses basic string.
    const start = `${dateStr}T${timeStr}`;
    const end = `${dateStr}T${endTimeStr}`;
    
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${start}/${end}`, '_blank');
  };

  return (
    <Card 
      className="flex h-full flex-col overflow-hidden cursor-pointer relative group border border-gray-200 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 p-0" 
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="relative h-40 w-full overflow-hidden bg-gray-100 shrink-0">
        {!imgError ? (
          <img referrerPolicy="no-referrer" 
            src={event.imageUrl || 'https://picsum.photos/seed/eventdefault/800/600'} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 text-transparent" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center p-4 text-center">
            <span className="text-indigo-200 font-bold text-lg opacity-50 uppercase tracking-widest">{event.category}</span>
          </div>
        )}
        <button 
          className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm backdrop-blur-md focus:outline-none transition-colors ${isSaved ? 'bg-indigo-50/90' : 'bg-white/80 hover:bg-white'} `}
          onClick={toggleSave}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? 'text-indigo-600 fill-current' : 'text-gray-600'}`} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1 bg-white">
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1.5" />
            {format(parseISO(event.date), 'MMM d')} • {event.locationArea}
          </div>
          <button 
            className="hover:text-indigo-600 transition-colors bg-gray-100 hover:bg-indigo-50 p-1.5 rounded"
            onClick={getCalendarUrl}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-bold text-[13px] leading-tight mb-1.5 text-[#111827] group-hover:text-indigo-600 transition-colors">{event.title}</h3>
        
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Public space
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {event.id.charCodeAt(1) * 2 + 5} interested • {(event.maxParticipants || 40) - 12} spots left
          </span>
          {event.minTrustTierAccess === '3_high_trust' && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-indigo-700 font-bold">
                <CheckCircle className="w-3 h-3 text-indigo-600" /> Verified users
              </span>
            </>
          )}
        </div>

        <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative mb-3">
          <img referrerPolicy="no-referrer" src="https://picsum.photos/seed/map/600/400" alt="Map Preview" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
          <div className="absolute inset-0 bg-indigo-600/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-indigo-600/20 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.8)]"></div>
          </div>
        </div>
        
        {event.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {event.tags && event.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {event.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="neutral" className="bg-gray-100 text-gray-600 shadow-none border-0 px-2 py-0.5 text-[9px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {organizer && (
          <div className="flex items-center gap-2 mb-4">
             <img referrerPolicy="no-referrer" src={organizer.photoUrl} alt={organizer.name} className="w-6 h-6 rounded-full object-cover" />
             <div className="flex flex-col">
               <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Organizer</span>
               <a 
                 href={`/organizer/${organizer.id}`} 
                 className="text-[11px] font-bold text-[#111827] hover:text-indigo-600 hover:underline"
                 onClick={(e) => { e.stopPropagation(); navigate(`/organizer/${organizer.id}`); }}
               >
                 {organizer.name}
               </a>
             </div>
          </div>
        )}
        
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Group Status</span>
            <span className="text-[10px] font-bold text-indigo-600 tracking-tight bg-indigo-50 px-2 py-0.5 rounded-full">Forming</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#111827] h-full w-[45%] rounded-full"></div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-[#111827]">
                {event.isPaid ? `€${event.price}` : 'Free'}
              </span>
              {event.isPaid && event.groupDiscount && (
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">-{event.groupDiscount.percentage}% Grp</span>
              )}
            </div>
            <button className="px-5 py-2 bg-[#111827] text-white text-[10px] uppercase tracking-wider font-bold rounded-full shadow-sm hover:bg-black transition-colors">Join</button>
          </div>
        </div>
      </div>
    </Card>
  );
}
