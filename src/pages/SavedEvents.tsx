import React from 'react';
import { Bookmark, MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Badge } from '../components/common/Badge';
import { useLanguage } from "../lib/i18n";

export default function SavedEvents() {
    const { t } = useLanguage();
    
  // Using some mock data for demonstration
  const savedEvents = [mockEvents[0], mockEvents[2]];

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
