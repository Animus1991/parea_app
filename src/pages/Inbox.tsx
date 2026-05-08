import React, { useState } from 'react';
import { Search, MessageSquare, Flame, CheckCircle2, Ghost, Plus, Pin, Clock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../lib/i18n";

export default function Inbox() {
    const { t } = useLanguage();
    
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const chats = [
    {
      id: 'g1',
      title: t(`Παράσταση Κωμωδίας`, `Comedy Show`),
      lastMessage: t(`Nikos: Θα συναντηθούμε στην είσοδο;`, `Nikos: Shall we meet at the entrance?`),
      time: '12:30 ΜΜ',
      unread: 3,
      image: 'https://picsum.photos/seed/comedy/500/500',
      participants: 6,
      status: 'active',
      isPinned: true,
      timeRemaining: t(`12 ώρες`, `12 hours`)
    },
    {
      id: 'g2',
      title: t(`Καφετέρια με Επιτραπέζια`, `Board Game Cafe`),
      lastMessage: t(`Εσύ: Θα φέρω το Catan!`, `You: I\'ll bring Catan!`),
      time: t(`Χθες`, `Yesterday`),
      unread: 0,
      image: 'https://picsum.photos/seed/boardgame/500/500',
      participants: 4,
      status: 'active',
      isPinned: false,
      timeRemaining: t(`2 μέρες`, `2 days`)
    },
    {
      id: 'g3',
      title: t(`Πρωινή Πεζοπορία Κυριακής`, `Sunday Morning Hike`),
      lastMessage: t(`Μαρία: Τέλεια διαδρομή παιδιά, ευχαριστώ!`, `Maria: Great trail guys, thanks!`),
      time: '14 Οκτ',
      unread: 0,
      image: 'https://picsum.photos/seed/hike/500/500',
      participants: 8,
      status: 'past',
      isPinned: false
    }
  ];

  const filteredChats = chats.filter(c => c.status === activeTab && c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-6rem)] relative pb-20 md:pb-0">
      
      {/* Sleek Header */}
      <div className="shrink-0 mb-6 px-1">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
</h1>
</div>
</div>
</div>
</div>
  );
}
