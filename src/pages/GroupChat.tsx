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

