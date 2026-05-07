import React, { useState } from 'react';
import { Search, MessageSquare, Plus, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/common/Card';

export default function Inbox() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const chats = [
    {
      id: 'g1',
      title: 'Stand-up Comedy Friday',
      lastMessage: 'Are we meeting at the entrance?',
      time: '12:30 PM',
      unread: 3,
      image: 'https://picsum.photos/seed/comedy/500/500',
      participants: 6
    },
    {
      id: 'g2',
      title: 'Board Games Cafe',
      lastMessage: 'I will bring Catan!',
      time: 'Yesterday',
      unread: 0,
      image: 'https://picsum.photos/seed/boardgame/500/500',
      participants: 4
    },
    {
      id: 'g3',
      title: 'Sunday Morning Hike',
      lastMessage: 'Awesome trail guys, thanks!',
      time: 'Mon',
      unread: 0,
      image: 'https://picsum.photos/seed/hike/500/500',
      participants: 8
    }
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Group Chats</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Stay connected with your event groups.</p>
        </div>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages or groups..." 
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 noscrollbar">
        {chats.map((chat) => (
          <div 
            key={chat.id} 
            className="bg-white border border-gray-100 p-3 md:p-4 rounded-xl flex items-center gap-4 hover:bg-gray-50 hover:border-indigo-100 transition-colors cursor-pointer"
            onClick={() => navigate(`/chat/${chat.id}`)}
          >
            <div className="relative shrink-0">
              <img referrerPolicy="no-referrer" src={chat.image} alt={chat.title} className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover" />
              {chat.unread > 0 && (
                <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {chat.unread}
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-0.5">
                <h3 className="font-bold text-[#111827] text-sm truncate pr-2">{chat.title}</h3>
                <span className={`text-[10px] font-bold shrink-0 ${chat.unread > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{chat.time}</span>
              </div>
              <p className={`text-xs truncate ${chat.unread > 0 ? 'text-[#111827] font-semibold' : 'text-gray-500'}`}>
                {chat.lastMessage}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
                {chat.participants} Members
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
