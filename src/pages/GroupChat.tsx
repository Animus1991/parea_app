import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockGroups } from '../data/mockGroups';
import { mockEvents } from '../data/mockEvents';
import { currentUser, mockUsers } from '../data/mockUsers';
import { Send, Users, ArrowLeft, Info, MapPin, Calendar, ShieldCheck, Tag, X, Clock, Pin, Settings2, ShieldAlert } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { useLanguage } from "../lib/i18n";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export default function GroupChat() {
    const { t } = useLanguage();
    
  const { groupId } = useParams();
  const navigate = useNavigate();
  const group = mockGroups.find(g => g.id === groupId) || mockGroups.find(g => g.eventId === groupId);
  const event = mockEvents.find(e => e.id === group?.eventId);
  
  const initialMessages: ChatMessage[] = Array.from({ length: 50 }).map((_, i) => ({
    id: `m${i}`,
    senderId: i % 2 === 0 ? 'u2' : (i % 3 === 0 ? 'u3' : currentUser.id),
    senderName: i % 2 === 0 ? 'Maria' : (i % 3 === 0 ? 'Nikos' : currentUser.name),
    text: `Δοκιμαστικό μήνυμα ${i} από προηγούμενες συζητήσεις.`,
    timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString()
  }));

  initialMessages.push(
    {
      id: 'system1',
      senderId: 'system',
      senderName: 'System',
      text: t(`Η ομάδα επιβεβαιώθηκε! Πείτε γεια στα νέα σας Nakamas. Οι λεπτομέρειες συνάντησης είναι διαθέσιμες στο πάνελ πληροφοριών.`, `Group confirmed! Say hello to your new Nakamas. Meeting details are available in the info panel.`),
      timestamp: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'msg-maria',
      senderId: 'u2',
      senderName: 'Maria',
      text: t(`Γεια σε όλους! Ανυπομονώ.`, `Hi everyone! Looking forward to it.`),
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const virtuosoRef = useRef<any>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: newMessage,
      timestamp: new Date().toISOString()
    };
    setMessages([...messages, msg]);
    setNewMessage('');
    setTimeout(() => {
      if (virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
      }
    }, 50);
  };

  const togglePinMessage = (id: string) => {
    setPinnedMessageIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
       if (virtuosoRef.current) {
         virtuosoRef.current.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' });
       }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!group || !event) {
        return <div className="p-8 text-center text-gray-500"></div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm z-10 w-full relative">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex -space-x-2 mr-2">
            {group.members.slice(0, 3).map((memberId: string) => {
              const u = mockUsers.find(u => u.id === memberId);
              return u ? <img key={u.id} src={u.photoUrl} alt="member" className="w-8 h-8 rounded-full border-2 border-white object-cover" /> : null;
            })}
          </div>
          <div>
            <h1 className="font-bold text-[#111827] text-sm leading-tight max-w-[150px] sm:max-w-[300px] truncate">{event.title}</h1>
            <p className="text-xs font-medium text-cyan-600">{group.members.length} {t('members', 'members')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-cyan-50 text-cyan-600' : 'hover:bg-gray-100 text-gray-600'}`}>
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
         <Virtuoso
            ref={virtuosoRef}
            data={messages}
            className="h-full w-full custom-scrollbar bg-[#f8f9fa]"
            itemContent={(index, msg) => {
              const isMine = msg.senderId === currentUser.id;
              const isSystem = msg.senderId === 'system';
              if (isSystem) {
                return (
                  <div className="py-4 flex justify-center px-4 w-full">
                    <div className="bg-gray-200/60 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium text-gray-600 flex items-center gap-2 shadow-sm border border-gray-100">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                      {msg.text}
                    </div>
                  </div>
                );
              }
              return (
                <div className={`flex flex-col w-full px-4 py-2 ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-[15px] leading-relaxed relative group ${isMine ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-[#111827] rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[10px] mt-1 block font-medium ${isMine ? 'text-cyan-100' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            }}
         />
      </div>
      <div className="bg-white border-t border-gray-200 p-3 shadow-lg z-10 w-full relative">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat.placeholder', 'Type a message...')}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all font-medium text-[15px]"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-cyan-600 text-white p-3 rounded-full hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center shrink-0"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}