import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockGroups } from '../data/mockGroups';
import { mockEvents } from '../data/mockEvents';
import { currentUser, mockUsers } from '../data/mockUsers';
import { Send, Users, ArrowLeft, Info, MapPin, Calendar, ShieldCheck, Tag, X, Clock, Filter } from 'lucide-react';
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
  
  // Lazy initializer: the 1000-message array is built only once on mount,
  // not on every re-render (useState ignores the initial value after first render).
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

  // Once mounted, auto scroll to bottom
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
        <div key={msg.id} className="text-center my-4 w-full">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {msg.text}
          </span>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex flex-col group py-2 w-full px-4 ${isMe ? 'items-end' : 'items-start'}`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1 mb-1">{isMe ? 'You' : msg.senderName}</span>
        <div className="flex items-center gap-2">
          {isMe && (
            <button 
              onClick={() => handleDeleteMessage(msg.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all rounded-full bg-gray-100"
              title="Delete message"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <div 
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white border border-gray-200 text-[#111827] rounded-tl-none shadow-sm'
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
    <div className="mx-auto max-w-full h-[calc(100vh-12rem)] flex bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
      <div className={`flex flex-col flex-1 ${showInfo ? 'hidden md:flex border-r border-gray-200' : 'flex'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-[#111827] transition-colors p-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-[#111827] line-clamp-1">{event.title}</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                <Users className="inline h-3 w-3 mr-1" /> {group.members.length} Members
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <select
              value={senderFilter}
              onChange={(e) => setSenderFilter(e.target.value)}
              className="text-[10px] uppercase font-bold border border-gray-200 rounded-full px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Senders</option>
              {groupMembersDetailed.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Search chat..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 text-xs border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24 sm:w-auto" 
            />
            <button 
              onClick={() => setShowInfo(true)}
              className="text-gray-400 hover:text-indigo-600 transition-colors p-2 md:hidden"
            >
               <Info className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hidden md:block"
            >
               <Info className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Messages Virtualized */}
        <div className="flex-1 overflow-hidden bg-gray-50/50 relative">
          <div className="absolute top-0 w-full text-center py-3 z-10 bg-gradient-to-b from-gray-50/90 to-transparent">
             <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg shadow-sm">
               <span className="text-amber-800 font-bold uppercase tracking-widest text-[10px] flex items-center gap-1">
                 <ShieldCheck className="h-3.5 w-3.5" /> Ephemeral Mode Active
               </span>
               <span className="text-amber-700 text-xs font-medium border-l border-amber-200 pl-2 flex items-center gap-1.5">
                 <Clock className="h-3.5 w-3.5" /> Chat self-destructs 24 hours after the event
               </span>
             </div>
          </div>
          
          <Virtuoso
            ref={virtuosoRef}
            data={filteredMessages}
            itemContent={renderMessage}
            className="h-full w-full custom-scrollbar"
            alignToBottom={true}
          />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-2 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 border-transparent rounded-full py-2.5 pl-4 pr-12 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {showInfo && (
        <div className="w-full md:w-80 bg-gray-50 shrink-0 flex flex-col overflow-y-auto absolute md:relative z-10 h-full border-l border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0">
            <h3 className="font-bold text-[#111827]">Group Info</h3>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-32 object-cover rounded-lg shadow-sm border border-gray-200 mb-3" />
              <h4 className="font-bold text-sm text-[#111827]">{event.title}</h4>
              
              {event.tags && event.tags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {event.tags.map((tag: string) => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              )}
              
              <div className="mt-3 space-y-2 text-xs font-medium text-gray-600">
                <p className="flex items-start gap-2"><Calendar className="h-4 w-4 shrink-0 text-gray-400" /> {new Date(event.date).toLocaleDateString()} at {event.time}</p>
                <p className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 text-gray-400" /> <span className="font-bold text-indigo-700">{event.exactLocation || event.locationArea}</span></p>
                <p className="flex items-start gap-2 mt-2 bg-indigo-50 text-indigo-800 p-2 rounded border border-indigo-100">
                  <Info className="h-4 w-4 shrink-0" /> Target Arrival: 20 mins before event
                </p>
              </div>
            </div>

            {event.groupDiscount && (
              <div className={`p-3 rounded-lg border ${group.discountUnlocked ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-100 border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Tag className={`h-4 w-4 ${group.discountUnlocked ? 'text-emerald-600' : 'text-gray-500'}`} />
                  <span className={`font-bold text-sm ${group.discountUnlocked ? 'text-emerald-800' : 'text-gray-700'}`}>
                    Group Discount
                  </span>
                </div>
                <p className={`text-xs font-medium ${group.discountUnlocked ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {group.discountUnlocked 
                    ? `Unlocked! ${event.groupDiscount.percentage}% off applied.` 
                    : `Need ${event.groupDiscount.minSize} members to unlock ${event.groupDiscount.percentage}% off.`}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                 <h4 className="font-bold text-xs uppercase tracking-widest text-gray-500">Group Members ({group.members.length}/{group.targetSize})</h4>
              </div>
              <input 
                type="text" 
                placeholder="Search members..." 
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 mb-3 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white" 
              />
              <div className="space-y-3">
                {groupMembersDetailed.filter(m => m.name.toLowerCase().includes(memberSearchQuery.toLowerCase())).map(member => {
                  const isCloseToEvent = false; // Mocking that the event is > 2 hours away
                  return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 relative group">
                       {member.photoUrl ? (
                         <img 
                           referrerPolicy="no-referrer"
                           src={member.photoUrl} 
                           alt={member.name} 
                           className={`w-full h-full object-cover transition-all ${!isCloseToEvent && member.id !== currentUser.id ? 'blur-sm grayscale opacity-70' : ''}`} 
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs bg-indigo-100 text-indigo-700">
                           {member.name.substring(0, 2)}
                         </div>
                       )}
                       {!isCloseToEvent && member.id !== currentUser.id && (
                         <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <ShieldCheck className="w-4 h-4 text-white" />
                         </div>
                       )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#111827]">{member.name} {member.id === currentUser.id && <span className="text-gray-400 font-medium">(You)</span>}</p>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 ${member.reliabilityScore >= 80 ? 'bg-emerald-100 text-emerald-700' : member.reliabilityScore >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          <ShieldCheck className="h-2.5 w-2.5" />
                          {member.reliabilityScore}%
                        </span>
                      </div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${member.reliabilityScore >= 80 ? 'text-emerald-600' : member.reliabilityScore >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {member.reliabilityScore >= 80 ? 'Highly Reliable' : member.reliabilityScore >= 50 ? 'Frequent Participant' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                )})}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
               <button 
                 onClick={() => setShowReportModal(true)}
                 className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 rounded transition-colors mb-2"
               >
                 Report Safety Issue
               </button>
               <button 
                 onClick={() => setShowLeaveModal(true)}
                 className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 rounded transition-colors"
               >
                 Leave Group
               </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-[#111827] mb-2">Leave Group?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to leave {event.title}? You might not be able to rejoin if the group is full.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  alert("You have left the group.");
                  setShowLeaveModal(false);
                  navigate(-1);
                }}
                className="w-full px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Yes, Leave Group
              </button>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="w-full px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#111827] mb-2">Private Safety Report</h3>
            <p className="text-sm text-gray-500 mb-4">
              This report goes directly to the Nakamas moderation team. It is strictly confidential and will not be shared with the group.
            </p>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none mb-4 focus:ring-2 focus:ring-indigo-600 outline-none"
              rows={4}
              placeholder="Please describe the issue..."
            ></textarea>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert("Your report has been submitted securely.");
                  setShowReportModal(false);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
