import React from 'react';
import { Bookmark, MapPin, Calendar, Users, ArrowRight, Flame } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { useLanguage } from "../lib/i18n";

export default function SavedEvents() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    
  const savedEvents = [mockEvents[0], mockEvents[2], mockEvents[5]];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20.104264919475px] md:text-[26.7902365993px] font-bold text-[#111827]">{t(`Αποθηκευμένα`, `Saved Events`)}</h1>
          <p className="text-gray-500 font-medium text-[13.551608211075px] md:text-[14.626916949961px] mt-1">{t(`Εκδηλώσεις που σας ενδιαφέρουν`, `Events you're interested in`)}</p>
        </div>
      </div>

      {savedEvents.length === 0 ? (
        <div className="text-center py-16">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[20.731614957278874px] font-bold text-gray-700 mb-1">{t(`Δεν έχετε αποθηκευμένα`, `No saved events`)}</h3>
          <p className="text-[16.56547605484px] text-gray-500">{t(`Πατήστε το εικονίδιο σελιδοδείκτη για να αποθηκεύσετε`, `Tap the bookmark icon to save events`)}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedEvents.map(event => (
            <Card key={event.id} className="p-4 hover:border-cyan-200 transition-colors cursor-pointer" onClick={() => navigate(`/events/${event.id}`)}>
              <div className="flex gap-4">
                <img src={event.imageUrl} alt={event.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="neutral" className="text-[12.1125px]">{event.category}</Badge>
                    {event.isPaid ? <Badge variant="blue" className="text-[12.1125px]">€{event.price}</Badge> : <Badge variant="success" className="text-[12.1125px]">{t(`Δωρεάν`, `Free`)}</Badge>}
                  </div>
                  <h3 className="font-bold text-[16.75971px] text-[#111827] truncate">{event.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[12.1125px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(parseISO(event.date), 'dd MMM yyyy')}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.locationArea}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(event.maxParticipants || 40) - (event.currentParticipants || 12)} {t(`θέσεις`, `spots`)}</span>
                  </div>
                  {event.isTrending && (
                    <div className="flex items-center gap-1 mt-2">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-[11.2px] font-bold text-orange-600">{t(`Γεμίζει γρήγορα!`, `Filling fast!`)}</span>
                      <div className="flex-1 bg-gray-100 h-1 rounded-full overflow-hidden ml-2">
                        <div className="bg-orange-400 h-full rounded-full" style={{ width: `${Math.round(((event.currentParticipants || 12) / (event.maxParticipants || 40)) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <Bookmark className="w-5 h-5 text-cyan-600 fill-cyan-600 shrink-0 self-center" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
