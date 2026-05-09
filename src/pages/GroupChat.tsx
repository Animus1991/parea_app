import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockGroups } from '../data/mockGroups';
import { mockEvents } from '../data/mockEvents';
import { currentUser, mockUsers } from '../data/mockUsers';
import { Send, Users, ArrowLeft, Info, MapPin, Calendar, ShieldCheck, Tag, X, Clock, Filter, Search } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export default function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  // Ensure we default to an array even if map fails, though mock data shouldn't
  const group = mockGroups.find(g => g.id === groupId) || mockGroups.find(g => g.eventId === groupId); // Fallback if routing passes eventId
  const event = mockEvents.find(e => e.id === group?.eventId);
  
  // Lazy initializer: the 1000-message array is built only once on mount
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const msgs: ChatMessage[] = Array.from({ length: 1000 }).map((_, i) => ({
      id: `m${i}`,
      senderId: i % 2 === 0 ? 'u2' : (i % 3 === 0 ? 'u3' : currentUser.id),
      senderName: i % 2 === 0 ? 'Maria' : (i % 3 === 0 ? 'Nikos' : currentUser.name),
      text: `Test message ${i} from previous conversations. ${i % 5 === 0 ? 'Looking forward to it!' : ''}`,
      timestamp: new Date(Date.now() - (1000 - i) * 60000).toISOString()
    }));
    msgs.push(
      {
        id: 'system1',
        senderId: 'system',
        senderName: 'System',
        text: 'Group confirmed! Say hi to your new Nakamas. Meeting details are available in the info panel.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'msg-maria',
        senderId: 'u2',
        senderName: 'Maria',
        text: 'Hey everyone! Excited for this.',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    );
    return msgs;
  });
  const [newMessage, setNewMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [showEphemeralBanner, setShowEphemeralBanner] = useState(true);
  const [isEphemeral, setIsEphemeral] = useState(true);
  const [showDisableEphemeralModal, setShowDisableEphemeralModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [senderFilter, setSenderFilter] = useState<string>('all');
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
    
    // Scroll to bottom after state update
    setTimeout(() => {
      if (virtuosoRef.current) {
        virtuosoRef.current.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'smooth' });
      }
    }, 50);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const filteredMessages = useMemo(() => {
    return messages
      .filter(m => senderFilter === 'all' || m.senderId === senderFilter)
      .filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, senderFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
       if (virtuosoRef.current) {
         virtuosoRef.current.scrollToIndex({ index: 'LAST', align: 'end', behavior: 'auto' });
       }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!group || !event) {
    return <div className="p-8 text-center text-gray-500">Chat not found or group not confirmed.</div>;
  }

  const groupMembersDetailed = group.members.map(mId => mockUsers.find(u => u.id === mId) || currentUser);

  const renderMessage = (index: number, msg: ChatMessage) => {
    const isSystem = msg.senderId === 'system';
    const isMe = msg.senderId === currentUser.id;

    if (isSystem) {
      return (
        <div key={msg.id} className="text-center my-6 flex justify-center w-full px-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#111827] bg-[#F3F4F6] px-4 py-2 rounded-full shadow-sm max-w-sm text-center leading-relaxed">
            {msg.text}
          </span>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex flex-col group py-2.5 w-full px-4 md:px-6 ${isMe ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 ml-1 mb-1">{isMe ? 'You' : msg.senderName}</span>
        <div className="flex items-center gap-2">
          {isMe && (
            <button 
              onClick={() => handleDeleteMessage(msg.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
              title="Delete message"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <div 
            className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed relative ${
              isMe 
                ? 'bg-[#111827] text-white rounded-tr-sm shadow-sm' 
                : 'bg-white border border-gray-200 text-[#111827] rounded-tl-sm shadow-sm'
            }`}
          >
            {msg.text}
          </div>
        </div>
        <span className="text-[10px] text-gray-400 mt-1 mr-1 font-medium tracking-wide">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full h-full px-[5px] md:px-0 mx-auto max-w-[1200px]">
      <div className="w-full h-[calc(100dvh-5rem)] md:h-[calc(100dvh-6rem)] flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
        <div className={`flex flex-col flex-1 h-full min-w-0 ${showInfo ? 'hidden md:flex border-r border-gray-200' : 'flex'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 md:px-5 py-3 border-b border-gray-200 bg-white shrink-0 relative z-20">
          {showSearchMobile ? (
             <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-right-4 duration-200">
               <button onClick={() => { setShowSearchMobile(false); setSearchQuery(''); }} className="p-2 text-gray-400 hover:text-[#111827]">
                  <ArrowLeft className="h-5 w-5" />
               </button>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Search chat..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] bg-gray-50" 
               />
               {searchQuery && (
                 <button onClick={() => setSearchQuery('')} className="p-2 text-gray-400 hover:text-gray-600">
                   <X className="h-4 w-4" />
                 </button>
               )}
             </div>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <button 
                  onClick={() => navigate(-1)}
                  className="text-gray-400 hover:text-[#111827] transition-colors p-1 shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-sm md:text-base font-bold text-[#111827] truncate">{event.title}</h2>
                  <p className="text-[10px] md:text-[11px] text-gray-500 uppercase tracking-wider font-bold truncate flex items-center gap-1.5 mt-0.5">
                    <Users className="h-3 w-3 shrink-0" /> {group.members.length} Members
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
                {/* Desktop Search & Filter */}
                <div className="hidden md:flex items-center gap-3 mr-2">
                  <select
                    value={senderFilter}
                    onChange={(e) => setSenderFilter(e.target.value)}
                    className="text-[11px] uppercase font-bold border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors max-w-[120px] truncate"
                  >
                    <option value="all">All Senders</option>
                    {groupMembersDetailed.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <div className="relative group">
                     <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                     <input 
                       type="text" 
                       placeholder="Search..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 xl:w-48 bg-gray-50 focus:bg-white transition-all" 
                     />
                  </div>
                </div>

                {/* Mobile Search Toggle */}
                <button 
                  onClick={() => setShowSearchMobile(true)}
                  className="text-gray-400 hover:text-[#111827] hover:bg-gray-100 rounded-full transition-colors p-2 md:hidden"
                >
                   <Search className="h-5 w-5" />
                </button>

                {/* Info Toggle */}
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className={`transition-colors p-2 rounded-full ${showInfo ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-[#111827] hover:bg-gray-100'}`}
                >
                   <Info className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Ephemeral Notice */}
        {isEphemeral && showEphemeralBanner && (
          <div className="w-full shrink-0 border-b border-amber-200/60 bg-amber-50/80 px-2 py-2 sm:px-3 text-center shadow-sm z-10 backdrop-blur-sm flex items-center justify-center relative">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800 pr-6 w-full">
              <span className="flex items-center justify-center gap-1.5 whitespace-nowrap"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Ephemeral Mode</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-amber-300 opacity-60 shrink-0"></span> 
              <span className="font-medium text-amber-700/80 flex items-center justify-center gap-1 leading-tight w-full max-w-full overflow-hidden">
                <Clock className="h-3 w-3 shrink-0" /> <span className="truncate whitespace-normal sm:whitespace-nowrap">Chat destructs 24h after event</span>
              </span>
            </div>
            <button 
              onClick={() => setShowEphemeralBanner(false)}
              className="p-1.5 text-amber-600/80 hover:bg-amber-200 hover:text-amber-800 rounded-full transition-colors absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 shrink-0"
              title="Close Banner"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        {/* Messages Virtualized */}
        <div className="flex-1 min-h-0 bg-[#F9FAFB] relative shadow-inner">
          <Virtuoso
            ref={virtuosoRef}
            data={filteredMessages}
            itemContent={renderMessage}
            className="h-full w-full custom-scrollbar"
            alignToBottom={true}
          />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-gray-200 bg-white shrink-0 relative z-20">
          <div className="flex items-center gap-2 md:gap-3 max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 border border-transparent rounded-full py-3 md:py-3.5 pl-5 pr-14 text-sm focus:bg-white focus:ring-2 focus:ring-[#111827] focus:border-[#111827] outline-none transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-3 md:right-4 p-2 md:p-2.5 bg-[#111827] text-white rounded-full hover:bg-gray-800 disabled:opacity-40 disabled:hover:bg-[#111827] transition-all shadow-sm"
            >
              <Send className="h-4 w-4 md:h-4.5 md:w-4.5" />
            </button>
          </div>
        </form>
      </div>

      {showInfo && (
        <div className="w-full md:w-[320px] lg:w-[380px] bg-white shrink-0 flex flex-col absolute md:relative z-30 h-full border-l border-gray-200 animate-in slide-in-from-right-8 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
            <h3 className="font-bold text-[#111827] text-sm tracking-wide">Group Details</h3>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-[#111827] p-1 rounded-full hover:bg-gray-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 bg-gray-50/50">
            {/* Event Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="relative h-28 w-full group">
                 <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                 <div className="absolute bottom-3 left-4 right-4">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{event.title}</h4>
                 </div>
              </div>
              
              <div className="p-4 space-y-3">
                {event.tags && event.tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {event.tags.map((tag: string) => (
                      <span key={tag} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-indigo-100">{tag}</span>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2.5 text-[13px] font-medium text-gray-600">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 shrink-0"><Calendar className="h-3.5 w-3.5" /></div>
                    <span className="pt-0.5">{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-gray-100 rounded-md text-gray-500 shrink-0"><MapPin className="h-3.5 w-3.5" /></div>
                    <span className="pt-0.5 text-[#111827] font-semibold">{event.exactLocation || event.locationArea}</span>
                  </div>
                </div>
                
                <div className="mt-4 bg-blue-50/80 text-blue-800 p-3 rounded-lg border border-blue-100 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" /> 
                  <span className="text-[11px] font-semibold tracking-wide">Target Arrival: 20 mins before event</span>
                </div>
              </div>
            </div>

            {event.groupDiscount && (
              <div className={`p-4 rounded-xl border shadow-sm ${group.discountUnlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-1.5 rounded-full ${group.discountUnlocked ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Tag className="h-4 w-4" />
                  </div>
                  <span className={`font-bold text-sm ${group.discountUnlocked ? 'text-emerald-800' : 'text-[#111827]'}`}>
                    Group Discount
                  </span>
                </div>
                <p className={`text-xs font-medium leading-relaxed ${group.discountUnlocked ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {group.discountUnlocked 
                    ? `Unlocked! ${event.groupDiscount.percentage}% off applied to your tickets.` 
                    : `Need ${event.groupDiscount.minSize} members to unlock ${event.groupDiscount.percentage}% off.`}
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                 <h4 className="font-bold text-[11px] uppercase tracking-widest text-[#111827]">Group Members</h4>
                 <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{group.members.length}/{group.targetSize}</span>
              </div>
              <div className="relative mb-4">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search members..." 
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111827] bg-gray-50 transition-all font-medium" 
                />
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {groupMembersDetailed.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).map(member => {
                  const isCloseToEvent = false;
                  return (
                  <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0 relative group shadow-sm border border-gray-100">
                       {member.photoUrl ? (
                         <img 
                           referrerPolicy="no-referrer"
                           src={member.photoUrl} 
                           alt={member.name} 
                           className={`w-full h-full object-cover transition-all ${!isCloseToEvent && member.id !== currentUser.id ? 'blur-sm grayscale opacity-80' : ''}`} 
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs bg-indigo-50 text-indigo-700">
                           {member.name.substring(0, 2)}
                         </div>
                       )}
                       {!isCloseToEvent && member.id !== currentUser.id && (
                         <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                           <ShieldCheck className="w-4 h-4 text-white mb-0.5" />
                           <span className="text-[7px] font-bold text-white uppercase tracking-widest text-center px-1">Hidden</span>
                         </div>
                       )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[13px] font-bold text-[#111827] truncate">
                          {member.name} {member.id === currentUser.id && <span className="text-gray-400 font-medium ml-1">(You)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <span className={`px-1.5 py-0.5 text-[8px] font-bold flex shrink-0 uppercase tracking-widest rounded-md items-center gap-1 border ${member.reliabilityScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : member.reliabilityScore >= 50 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                           <ShieldCheck className="h-2.5 w-2.5" />
                           {member.reliabilityScore}%
                         </span>
                         <p className={`text-[9px] font-bold uppercase tracking-wider truncate ${member.reliabilityScore >= 80 ? 'text-emerald-600' : member.reliabilityScore >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                           {member.reliabilityScore >= 80 ? 'Highly Reliable' : member.reliabilityScore >= 50 ? 'Frequent' : 'Needs Work'}
                         </p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>

            {/* Chat Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
               <h4 className="font-bold text-[11px] uppercase tracking-widest text-[#111827] mb-3 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gray-400" /> Chat Privacy</h4>
               <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-[#111827]">Ephemeral Mode</p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">Chat history deletes automatically 24h after the event. All members must agree to keep it permanently.</p>
                  </div>
                  <button 
                    onClick={() => {
                       if (isEphemeral) {
                         setShowDisableEphemeralModal(true);
                       } else {
                         setIsEphemeral(true);
                       }
                    }}
                    role="switch"
                    aria-checked={isEphemeral}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#111827] focus:ring-offset-2 ${isEphemeral ? 'bg-[#111827]' : 'bg-gray-200'}`}
                  >
                    <span className="sr-only">Toggle ephemeral mode</span>
                    <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEphemeral ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
               </div>
            </div>
            
            <div className="space-y-2 pt-2">
               <button 
                 onClick={() => setShowReportModal(true)}
                 className="w-full py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-red-600 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-lg transition-colors flex justify-center items-center gap-2"
               >
                 Report Safety Issue
               </button>
               <button 
                 onClick={() => setShowLeaveModal(true)}
                 className="w-full py-2.5 px-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
               >
                 Leave Group
               </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-2">Leave Group?</h3>
            <p className="text-xs font-medium leading-relaxed text-gray-500 mb-6">
              Are you sure you want to leave <span className="font-bold text-gray-700">{event.title}</span>? You might not be able to rejoin if the group is full.
            </p>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  alert("You have left the group.");
                  setShowLeaveModal(false);
                  navigate(-1);
                }}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Yes, Leave Group
              </button>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="w-full px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisableEphemeralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-2">Keep Chat History?</h3>
            <p className="text-xs font-medium leading-relaxed text-gray-500 mb-6">
              You are proposing to turn off Ephemeral Mode. If all group members agree, this chat will be kept permanently instead of being deleted automatically.
            </p>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    senderId: 'system',
                    senderName: 'System',
                    text: `${currentUser.name} proposed to disable Ephemeral Mode. Voting will begin shortly.`,
                    timestamp: new Date().toISOString()
                  }]);
                  setIsEphemeral(false);
                  setShowDisableEphemeralModal(false);
                  setShowInfo(false);
                }}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-[#111827] hover:bg-gray-900 rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                Propose to Group
              </button>
              <button 
                onClick={() => setShowDisableEphemeralModal(false)}
                className="w-full px-4 py-3 text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">Private Safety Report</h3>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Strictly Confidential</p>
              </div>
            </div>
            <p className="text-xs font-medium leading-relaxed text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              This report goes directly to the Nakamas moderation team. It will <span className="font-bold text-gray-800">not</span> be shared with the group members. Help us keep the community safe.
            </p>
            <textarea 
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none mb-5 focus:ring-2 focus:ring-[#111827] outline-none shadow-sm font-medium transition-all"
              rows={4}
              placeholder="Please describe the issue in detail..."
            ></textarea>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert("Your report has been submitted securely.");
                  setShowReportModal(false);
                }}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#111827] hover:bg-gray-900 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

