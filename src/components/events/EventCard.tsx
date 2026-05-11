import React, { useState, memo } from 'react';
import { Card } from '../common/Card';
import { Bookmark, Share2, Users, MapPin, Clock, Flame } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { el } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { mockUsers } from '../../data/mockUsers';
import { useLanguage } from "../../lib/i18n";
import type { Event } from '../../types';

interface EventCardProps {
  event: Event;
}

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
    const { t } = useLanguage();
    
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
    let endHour = parseInt(event.time ? event.time.split(':')[0] : '0') + 2;
    if (endHour >= 24) endHour = endHour - 24;
    const endHourStr = endHour.toString().padStart(2, '0');
    const minStr = event.time ? event.time.split(':')[1] : '00';
    const endTimeStr = `${endHourStr}${minStr}00`;
    const start = `${dateStr}T${timeStr}`;
    const end = `${dateStr}T${endTimeStr}`;
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}&dates=${start}/${end}`, '_blank');
  };

  const eventDate = parseISO(event.date);
  const day = format(eventDate, 'd');
  const month = format(eventDate, 'MMM', { locale: el }).toUpperCase();

  return (
    <Card 
      className="flex h-full flex-col overflow-hidden cursor-pointer relative group border-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-2xl bg-white p-0" 
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="relative h-48 w-full overflow-hidden bg-gray-100 shrink-0">
        {!imgError ? (
          <img referrerPolicy="no-referrer" 
            src={event.imageUrl || 'https://picsum.photos/seed/eventdefault/800/600'} 
            alt={event.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-100 to-purple-50 flex items-center justify-center p-4 text-center">
            <span className="text-cyan-300 font-bold text-[20.731614957278874px] uppercase tracking-wider">{event.category}</span>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 space-y-0" />
        
        {/* Date Badge over image */}
        <div className="absolute top-3 left-3 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl w-12 h-[50px] shadow-sm border border-white/20">
          <span className="text-[12.1125px] font-bold text-[#0E8B8D] uppercase tracking-tighter leading-none mb-0.5">{month}</span>
          <span className="text-[20.731614957278874px] font-black text-gray-900 leading-none">{day}</span>
        </div>

        {/* Trending badge */}
        {event.isTrending && (
          <div className="absolute top-14 left-3 flex items-center gap-1 bg-orange-500/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-md shadow-sm">
            <Flame className="w-2.5 h-2.5" />
            <span className="text-[12.1125px] font-bold uppercase tracking-wider">{t(`Trending`, `Trending`)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button 
            className="p-2 rounded-full shadow-sm backdrop-blur-md focus:outline-none transition-colors bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: event.title,
                  url: `${window.location.origin}/events/${event.id}`,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
                alert(t(`Ο σύνδεσμος αντιγράφηκε στο πρόχειρο!`, `Link copied to clipboard!`));
              }
            }}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button 
            className={`p-2 rounded-full shadow-sm backdrop-blur-md focus:outline-none transition-colors ${isSaved ? 'bg-[#18D8DB]/20 text-[#0E8B8D]' : 'bg-white/80 hover:bg-white text-gray-600 hover:text-[#0E8B8D]'}`}
            onClick={toggleSave}
          >
            <Bookmark className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Price & Tag info at bottom of image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between z-10">
          <div className="flex flex-wrap gap-1.5">
            {event.tags && event.tags.slice(0, 2).map((tag: string) => (
              <span key={tag} className="bg-black/40 backdrop-blur-md text-white/90 border border-white/10 px-2 py-1 space-x-1 rounded-md text-[12.1125px] font-semibold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
          <div className="bg-white px-2.5 py-1 rounded-lg shadow-sm font-bold text-[#111827] text-[13.233495595550108784px] uppercase tracking-wider flex flex-col items-end">
            {event.isPaid ? `€${event.price}` : t(`ΔΩΡΕΑΝ`, `FREE`)}
            {event.isPaid && event.groupDiscount && (
               <span className="text-[12.1125px] text-[#0E8B8D] leading-none block mt-0.5">-{event.groupDiscount.percentage}% GRP</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-[16.75971px] leading-snug text-[#111827] group-hover:text-[#0E8B8D] transition-colors line-clamp-2">
            {event.title}
          </h3>
        </div>
        
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center text-gray-600 text-[14.38965px] font-medium">
             <Clock className="w-3.5 h-3.5 mr-2 text-gray-400" />
             {format(eventDate, 'EEEE', { locale: el })}, {event.time}
          </div>
          <div className="flex items-center text-gray-600 text-[14.535px] font-medium">
             <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
             {event.locationArea}
          </div>
          <div className="flex items-center text-gray-600 text-[14.535px] font-medium">
             <Users className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
             <span>{(event.maxParticipants || 40) - (event.currentParticipants || 12)} {t(`θέσεις απομένουν`, `spots left`)}</span>
          </div>
        </div>

        {/* Social proof — friends interested */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex -space-x-1.5">
            <img src="https://i.pravatar.cc/24?u=f1" className="w-5 h-5 rounded-full border border-white" alt="" />
            <img src="https://i.pravatar.cc/24?u=f2" className="w-5 h-5 rounded-full border border-white" alt="" />
            <img src="https://i.pravatar.cc/24?u=f3" className="w-5 h-5 rounded-full border border-white" alt="" />
          </div>
          <span className="text-[12.5px] text-gray-500 font-medium">
            {t(`3 φίλοι ενδιαφέρονται`, `3 friends interested`)}
          </span>
        </div>

        {/* Organizer info */}
        {organizer && (
          <div className="flex items-center gap-2 mb-3 bg-gray-50/80 rounded-lg p-2 border border-gray-100">
             <img referrerPolicy="no-referrer" src={organizer.photoUrl} alt={organizer.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
             <div className="flex flex-col">
               <span className="text-[12.1125px] text-gray-400 uppercase tracking-wider font-bold">
                 {t(`ΔΙΟΡΓΑΝΩΤΗΣ`, `ORGANIZER`)}
               </span>
               <button
                 className="text-[15px] font-semibold text-gray-900 text-left hover:text-[#0E8B8D] transition-colors"
                 onClick={(e) => { e.stopPropagation(); navigate(`/organizer/${organizer.id}`); }}
               >
                 {organizer.name}
               </button>
             </div>
          </div>
        )}

        {/* Group progress + Join */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12.1125px] font-bold text-gray-400 uppercase tracking-widest">
              {t(`Σχηματισμός`, `Forming`)}
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
            <div className="bg-[#18D8DB] h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round(((event.currentParticipants || 12) / (event.maxParticipants || 40)) * 100))}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="text-[12.1125px] text-gray-500 hover:text-[#0E8B8D] transition-colors font-medium underline underline-offset-2"
              onClick={getCalendarUrl}
              title="Add to Google Calendar"
            >
              + Cal
            </button>
            <button className="px-5 py-2 bg-[#111827] text-white text-[12.1125px] uppercase tracking-wider font-bold rounded-full shadow-sm hover:bg-black transition-colors">
              {t(`Συμμετοχή`, `Join`)}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
});