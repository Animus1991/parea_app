import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { MessageCircle, MapPin, Search, Calendar, Star, Clock, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { mockEvents } from '../data/mockEvents';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export default function Plans() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'past'>('upcoming');
  const navigate = useNavigate();
  
  // Mocks based on events
  const upcomingEvents = mockEvents.filter(e => e.id === 'e4' || e.id === 'e1');
  const pendingEvents = mockEvents.filter(e => e.id === 'e5');
  const pastEvents = mockEvents.filter(e => e.id === 'e2' || e.id === 'e3');

  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-8 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#111827]">My Plans</h1>
        <p className="mt-1 text-xs text-gray-500 font-medium">Manage your upcoming experiences, pending groups, and past events.</p>
      </div>

      {/* Action required prompt */}
      <Card className="rounded-xl p-4 border border-amber-200 bg-amber-50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-[#111827] text-sm mb-1">Verify your identity</h3>
            <p className="text-xs text-amber-800 font-medium">You need to complete ID verification to join the "Arachova Retreat" you expressed interest in.</p>
          </div>
        </div>
        <button onClick={() => navigate('/trust')} className="bg-amber-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-amber-700 transition-colors whitespace-nowrap shrink-0 snap-center">
          Verify Now
        </button>
      </Card>

      <div className="flex gap-4 border-b border-gray-200 overflow-x-auto noscrollbar">
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'upcoming' 
              ? 'border-b-2 border-indigo-600 text-indigo-900' 
              : 'text-gray-500 hover:text-[#111827]'
          }`}
        >
          Upcoming Confirmed
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'pending' 
              ? 'border-b-2 border-indigo-600 text-indigo-900' 
              : 'text-gray-500 hover:text-[#111827]'
          }`}
        >
          Pending & Waitlists
        </button>
        <button 
          onClick={() => setActiveTab('past')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
            activeTab === 'past' 
              ? 'border-b-2 border-indigo-600 text-indigo-900' 
              : 'text-gray-500 hover:text-[#111827]'
          }`}
        >
          Past & Feedback
        </button>
      </div>

      {activeTab === 'upcoming' && (
      <div className="space-y-4">
        {upcomingEvents.map(event => (
          <Card key={event.id} className="rounded-xl p-4 sm:p-5 border border-indigo-100 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Confirmed
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-base text-[#111827]">{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gray-900">{format(parseISO(event.date), 'MMM d')}</div>
                  <div className="text-xs font-medium text-gray-500">{event.time}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1" /> Meeting point active
                </div>
                <div className="flex items-center text-xs text-gray-600 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" /> {event.duration}
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                <button onClick={() => navigate(`/chat/${event.id}`)} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                  <MessageCircle className="h-4 w-4" /> Group Chat
                </button>
                <button onClick={() => navigate(`/events/${event.id}`)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                  Details
                </button>
              </div>
            </div>
          </Card>
        ))}
        
        {upcomingEvents.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium text-sm mb-4">No upcoming confirmed plans.</p>
            <button className="bg-[#111827] text-white px-5 py-2 rounded-full text-xs font-bold" onClick={() => navigate('/')}>Explore Experiences</button>
          </div>
        )}
      </div>
      )}

      {activeTab === 'pending' && (
      <div className="space-y-4">
        {pendingEvents.map(event => (
          <Card key={event.id} className="rounded-xl p-4 sm:p-5 border border-gray-200 flex flex-col sm:flex-row gap-4 opacity-75 hover:opacity-100 transition-opacity">
            <div className="w-full sm:w-32 h-32 sm:h-auto shrink-0 bg-gray-100 rounded-lg overflow-hidden relative grayscale">
              <img referrerPolicy="no-referrer" src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                Pending Group
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-base text-[#111827] opacity-80">{event.title}</h3>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gray-900">{format(parseISO(event.date), 'MMM d')}</div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 font-medium mb-4">
                You expressed interest. Waiting for 2 more people to confirm the group and unlock the meeting point.
              </p>

              <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                <button onClick={() => navigate(`/events/${event.id}`)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                  View Status
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}

      {activeTab === 'past' && (
      <div className="space-y-4">
        {pastEvents.map((event, index) => (
          <Card key={event.id} className="rounded-xl p-4 sm:p-5 border border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {format(parseISO(event.date), 'MMMM d, yyyy')}
              </div>
              <h3 className="font-bold text-base text-[#111827] mb-3">{event.title}</h3>
              
              {index === 0 ? (
                <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center justify-between mt-auto">
                  <div className="text-xs font-bold text-indigo-900">Feedback required</div>
                  <button onClick={() => navigate(`/history/feedback/${event.id}`)} className="text-[10px] font-bold bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 uppercase tracking-wider">
                    Rate Experience
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-auto text-xs font-bold text-emerald-600">
                  <CheckCircle className="w-4 h-4" /> Feedback submitted
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}

