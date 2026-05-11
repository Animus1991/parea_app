import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockGroups } from '../data/mockGroups';
import { mockEvents } from '../data/mockEvents';
import { currentUser, mockUsers } from '../data/mockUsers';
import { Send, Users, ArrowLeft, Info, MapPin, Calendar, ShieldCheck, Tag, X, Clock, Search, CheckCheck, Smile } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { useLanguage } from "../lib/i18n";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  reactions?: Record<string, string[]>;
}

export default function GroupChat() {
  const { t } = useLanguage();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const group = mockGroups.find(g => g.id === groupId) || mockGroups.find(g => g.eventId === groupId);
  const event = mockEvents.find(e => e.id === group?.eventId);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const msgs: ChatMessage[] = Array.from({ length: 50 }).map((_, i) => ({
      id: `m${i}`,
      senderId: i % 2 === 0 ? 'u2' : (i % 3 === 0 ? 'u3' : currentUser.id),
      senderName: i % 2 === 0 ? 'Maria' : (i % 3 === 0 ? 'Nikos' : currentUser.name),
      text: `Test message ${i}`,
      timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString()
    }));
    msgs.push(
      { id: 'system1', senderId: 'system', senderName: 'System', text: 'Group confirmed! Meeting details in info panel.', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: 'msg-maria', senderId: 'u2', senderName: 'Maria', text: 'Hey everyone! Excited for this.', timestamp: new Date(Date.now() - 3600000).toISOString() }
    );
    return msgs;
  });
  const [newMessage, setNewMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [senderFilter, setSenderFilter] = useState<string>('all');
  const [isEphemeral, setIsEphemeral] = useState(true);
  const [showEphemeralBanner, setShowEphemeralBanner] = useState(true);
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
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
    }, 50);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const filteredMessages = useMemo(() => {
    return messages
      .filter(m => senderFilter === 'all' || m.senderId === senderFilter)
      .filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, senderFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      virtuosoRef.current?.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!group || !event) {
    return <div className="p-8 text-center text-gray-500 font-medium">{t(`Η ομάδα δεν βρέθηκε`, `Group not found`)}</div>;
  }

  const groupMembers = group.members.map((mId: string) => mockUsers.find(u => u.id === mId) || currentUser);

  return (
    <div className="w-full h-full mx-auto">
      <div className="w-full h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        {/* Main chat column */}
        <div className={`flex flex-col flex-1 h-full min-w-0 ${showInfo ? 'hidden md:flex border-r border-gray-200' : 'flex'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-gray-200 bg-white shrink-0 z-20">
            {showSearchMobile ? (
              <div className="flex items-center gap-2 w-full">
                <button onClick={() => { setShowSearchMobile(false); setSearchQuery(''); }} className="p-2 text-gray-400 hover:text-[#111827]">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <input
                  autoFocus
                  type="text"
                  placeholder={t(`Αναζήτηση στη συζήτηση...`, `Search chat...`)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-[18px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-gray-50"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="p-2 text-gray-400"><X className="h-4 w-4" /></button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#111827] p-1 shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="flex -space-x-2 mr-1">
                    {group.members.slice(0, 3).map((memberId: string) => {
                      const u = mockUsers.find(u => u.id === memberId);
                      return u ? <img key={u.id} src={u.photoUrl} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover" /> : null;
                    })}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-[#111827] truncate">{event.title}</h2>
                    <p className="text-[12.5px] text-gray-500 font-bold flex items-center gap-1">
                      <Users className="h-3 w-3" /> {group.members.length} {t(`μέλη`, `members`)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Desktop search */}
                  <div className="hidden md:flex items-center gap-2 mr-2">
                    <select value={senderFilter} onChange={(e) => setSenderFilter(e.target.value)} className="text-[12.5px] font-bold border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-600">
                      <option value="all">{t(`Όλοι`, `All`)}</option>
                      {groupMembers.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <div className="relative">
                      <Search className="h-3 w-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={t(`Αναζήτηση...`, `Search...`)}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-7 pr-2 py-1.5 text-[13.8px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 w-28 bg-gray-50"
                      />
                    </div>
                  </div>
                  <button onClick={() => setShowSearchMobile(true)} className="text-gray-400 hover:text-[#111827] p-2 md:hidden rounded-full">
                    <Search className="h-5 w-5" />
                  </button>
                  <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-colors ${showInfo ? 'text-cyan-600 bg-cyan-50' : 'text-gray-400 hover:text-[#111827] hover:bg-gray-100'}`}>
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Ephemeral banner */}
          {isEphemeral && showEphemeralBanner && (
            <div className="shrink-0 border-b border-amber-200/60 bg-amber-50/80 px-3 py-2 flex items-center justify-center relative">
              <div className="flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-wider text-amber-800">
                <ShieldCheck className="h-3.5 w-3.5" /> {t(`Ephemeral Mode`, `Ephemeral Mode`)}
                <span className="hidden sm:inline w-1 h-1 rounded-full bg-amber-300" />
                <span className="font-medium text-amber-700/80 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {t(`Η συζήτηση αυτοκαταστρέφεται 24ω μετά`, `Chat auto-deletes 24h after event`)}
                </span>
              </div>
              <button onClick={() => setShowEphemeralBanner(false)} className="absolute right-2 p-1 text-amber-600 hover:text-amber-800 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 min-h-0 bg-[#F9FAFB]">
            <Virtuoso
              ref={virtuosoRef}
              data={filteredMessages}
              className="h-full w-full"
              alignToBottom={true}
              itemContent={(index, msg) => {
                const isMine = msg.senderId === currentUser.id;
                const isSystem = msg.senderId === 'system';
                if (isSystem) {
                  return (
                    <div className="py-3 flex justify-center px-4 w-full">
                      <span className="text-[12.5px] font-bold uppercase tracking-widest text-[#111827] bg-gray-100 px-4 py-2 rounded-full shadow-sm">
                        {msg.text}
                      </span>
                    </div>
                  );
                }
                return (
                  <div className={`flex flex-col w-full px-4 py-2 group ${isMine ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10.08px] font-bold uppercase tracking-wider text-gray-500 mb-0.5 ml-1">{isMine ? t(`Εσύ`, `You`) : msg.senderName}</span>
                    <div className="flex items-center gap-1.5">
                      {isMine && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-full transition-all">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15.75px] leading-relaxed shadow-sm ${isMine ? 'bg-cyan-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 text-[#111827] rounded-tl-sm'}`}>
                        {msg.text}
                      </div>
                      {!isMine && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                          {['👍', '😂', '❤️'].map(emoji => (
                            <button key={emoji} onClick={(e) => { e.stopPropagation(); }} className="w-5 h-5 text-[11.25px] hover:bg-gray-100 rounded-full flex items-center justify-center">{emoji}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 mt-0.5 ml-1">
                        {(Object.entries(msg.reactions) as [string, string[]][]).map(([emoji, users]) => (
                          <span key={emoji} className="text-[11.25px] bg-gray-100 px-1.5 py-0.5 rounded-full">{emoji} {users.length}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[10.08px] font-medium ${isMine ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3 text-cyan-400" />}
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* Quick Replies */}
          <div className="px-3 pt-2 pb-0 bg-white shrink-0 flex gap-2 overflow-x-auto noscrollbar">
            {[t(`Θα αργήσω λίγο!`, `I'll be a bit late!`), t(`Στην πορεία!`, `On my way!`), t(`Ποιο μετρό;`, `Which metro?`), t(`Ανυπομονώ!`, `Can't wait!`)].map(reply => (
              <button key={reply} onClick={() => setNewMessage(reply)} className="shrink-0 px-3 py-1 rounded-full border border-gray-200 text-[11.25px] font-medium text-gray-600 hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-700 transition-colors">
                {reply}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t-0 border-gray-200 bg-white shrink-0 z-20">
            <div className="flex items-center gap-2 max-w-4xl mx-auto relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t(`Γράψτε μήνυμα...`, `Type a message...`)}
                className="flex-1 bg-gray-100 border border-transparent rounded-full py-2 pl-4 pr-12 text-[16.2px] focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-1 p-2.5 bg-cyan-600 text-white rounded-full hover:bg-cyan-700 disabled:opacity-40 transition-all shadow-sm"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Info Panel */}
        {showInfo && (
          <div className="w-full md:w-[320px] bg-white shrink-0 flex flex-col absolute md:relative z-30 h-full border-l border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-[#111827] text-[13.5px] uppercase tracking-widest">{t(`Λεπτομέρειες`, `Details`)}</h3>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-[#111827] p-1 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {/* Event summary */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="relative h-24 w-full">
                  <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <h4 className="font-bold text-white text-[12.42px] line-clamp-1">{event.title}</h4>
                  </div>
                </div>
                <div className="p-3 space-y-2 text-[12.42px] text-gray-600 font-medium">
                  <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-gray-400" /> {new Date(event.date).toLocaleDateString()} • {event.time}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" /> <span className="text-[#111827] font-semibold">{event.exactLocation || event.locationArea}</span></div>
                </div>
              </div>

              {/* Group discount */}
              {event.groupDiscount && (
                <div className={`p-3 rounded-xl border shadow-sm ${(group as any).discountUnlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3.5 w-3.5 text-gray-500" />
                    <span className="font-bold text-[12.42px] text-[#111827]">{t(`Ομαδική έκπτωση`, `Group Discount`)}</span>
                  </div>
                  <p className="text-[11.25px] text-gray-500 font-medium">
                    {(group as any).discountUnlocked
                      ? t(`Ξεκλειδώθηκε! ${event.groupDiscount.percentage}% έκπτωση.`, `Unlocked! ${event.groupDiscount.percentage}% off.`)
                      : t(`Χρειάζονται ${event.groupDiscount.minSize} μέλη για ${event.groupDiscount.percentage}% έκπτωση.`, `Need ${event.groupDiscount.minSize} members for ${event.groupDiscount.percentage}% off.`)}
                  </p>
                </div>
              )}

              {/* Members */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[11.25px] uppercase tracking-widest text-[#111827]">{t(`Μέλη`, `Members`)}</h4>
                  <span className="text-[11.25px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{group.members.length}/{group.targetSize}</span>
                </div>
                <div className="space-y-2.5 max-h-[200px] overflow-y-auto">
                  {groupMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 border border-gray-100">
                        {member.photoUrl ? (
                          <img referrerPolicy="no-referrer" src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11.2px] font-bold bg-cyan-50 text-cyan-700">{member.name.substring(0, 2)}</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.42px] font-bold text-[#111827] truncate">
                          {member.name} {member.id === currentUser.id && <span className="text-gray-400 font-medium">({t(`Εσύ`, `You`)})</span>}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${member.reliabilityScore >= 80 ? 'text-emerald-600' : member.reliabilityScore >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                          <ShieldCheck className="inline h-2.5 w-2.5 mr-0.5" />{member.reliabilityScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button onClick={() => setShowReportModal(true)} className="w-full py-2 text-[11.25px] font-bold uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                  {t(`Αναφορά ασφαλείας`, `Report Safety Issue`)}
                </button>
                <button onClick={() => setShowLeaveModal(true)} className="w-full py-2 text-[11.25px] font-bold uppercase tracking-wider text-gray-500 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors">
                  {t(`Αποχώρηση`, `Leave Group`)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100">
              <h3 className="text-[23px] font-bold text-[#111827] mb-2">{t(`Αποχώρηση;`, `Leave Group?`)}</h3>
              <p className="text-[13.8px] text-gray-500 font-medium mb-5">
                {t(`Είσαι σίγουρος ότι θέλεις να αποχωρήσεις; Ίσως δεν μπορέσεις να ξαναμπείς.`, `Are you sure? You might not be able to rejoin.`)}
              </p>
              <div className="flex flex-col gap-2">
                <button onClick={() => { setShowLeaveModal(false); navigate(-1); }} className="w-full py-2.5 text-[18px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl">
                  {t(`Ναι, αποχώρηση`, `Yes, Leave`)}
                </button>
                <button onClick={() => setShowLeaveModal(false)} className="w-full py-2.5 text-[18px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200">
                  {t(`Ακύρωση`, `Cancel`)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#111827]">{t(`Εμπιστευτική αναφορά`, `Private Safety Report`)}</h3>
                  <p className="text-[11.2px] font-bold text-gray-500 uppercase tracking-widest">{t(`Εμπιστευτικό`, `Confidential`)}</p>
                </div>
              </div>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-[18px] resize-none mb-4 focus:ring-2 focus:ring-cyan-500 outline-none"
                rows={4}
                placeholder={t(`Περιγράψτε το πρόβλημα...`, `Please describe the issue...`)}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-[13.8px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200">
                  {t(`Ακύρωση`, `Cancel`)}
                </button>
                <button onClick={() => { alert(t(`Η αναφορά υποβλήθηκε.`, `Report submitted.`)); setShowReportModal(false); }} className="px-4 py-2 text-[13.8px] font-bold text-white bg-[#111827] hover:bg-gray-900 rounded-xl shadow-sm">
                  {t(`Υποβολή`, `Submit`)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}