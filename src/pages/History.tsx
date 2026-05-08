import React from 'react';
import { History as HistoryIcon, MapPin, Calendar, Clock, Star, MessageSquare } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../lib/i18n";

export default function History() {
    const { t } = useLanguage();
    
  const pastEvents = mockEvents.slice(0, 3); // Just using some mock data for display
  const navigate = useNavigate();

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">
</h1>
</div>
</div>
</div>
  );
}
