import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockEvents } from '../data/mockEvents';
import { mockGroups } from '../data/mockGroups';
import { mockUsers, currentUser } from '../data/mockUsers';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton, EventDetailSkeleton } from '../components/common/Skeleton';
import { Calendar, MapPin, Users, Ticket, ShieldCheck, Clock, CheckCircle, AlertTriangle, Share, Bookmark, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';

function Group({ group, event, navigate }: { group: any; event: any; navigate: any; key?: any }) {
  const spotsLeft = group.targetSize - group.members.length;
  const isDiscountEligible = event.groupDiscount && group.targetSize >= event.groupDiscount.minSize;
  const discountUnlockedTemp = event.groupDiscount && group.members.length >= event.groupDiscount.minSize;
  const membersNeededForDiscount = event.groupDiscount ? Math.max(0, event.groupDiscount.minSize - group.members.length) : 0;
  
  return (
    <div className="relative rounded-xl border border-gray-200 p-4 shadow-sm hover:border-indigo-300 transition cursor-pointer" onClick={() => navigate(`/events/${event.id}/join`)}>
      {(group.discountUnlocked || discountUnlockedTemp) && event.groupDiscount && (
        <div className="absolute -top-2.5 -right-2.5 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 uppercase">
           <CheckCircle className="h-3 w-3" /> {event.groupDiscount.percentage}% Discount Unlocked
        </div>
      )}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            {group.members.length} / {group.targetSize} spots filled
          </div>
          <Badge variant={group.status === 'confirmed' ? 'outline' : 'neutral'}>
            {spotsLeft === 1 ? '1 Spot Left!' : spotsLeft + ' Spots Left'}
          </Badge>
        </div>
      </div>
      
      {isDiscountEligible && !discountUnlockedTemp && (
        <div className="bg-amber-50 border border-amber-200 p-2 rounded mb-3">
          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wide">
            Discount Progress
          </p>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-1.5 flex-1 bg-amber-200 rounded-full overflow-hidden">
               <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(group.members.length / event.groupDiscount.minSize) * 100}%` }}></div>
            </div>
            <span className="text-[9px] font-bold text-amber-700">{membersNeededForDiscount} more for {event.groupDiscount.percentage}% OFF</span>
          </div>
        </div>
      )}
      
      {!isDiscountEligible && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
          Small & private group.
        </p>
      )}

      {event.tags && event.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {event.tags.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="neutral" className="bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none border-0 px-2.5 py-0.5 text-[9px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <Button 
        variant="outline" 
        size="sm" 
        className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50"
        onClick={(e) => { e.stopPropagation(); navigate(`/events/${event.id}/join`); }}
      >
        Join Group
      </Button>
    </div>
  );
}

export default function EventDetail() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [groupSizeFilter, setGroupSizeFilter] = useState<'All' | '3' | '4' | '5' | '6+'>('All');
  const [discountFilter, setDiscountFilter] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [eventId]);

  const event = mockEvents.find(e => e.id === eventId);
  
  let eventGroups = mockGroups
    .filter(g => g.eventId === eventId)
    .sort((a, b) => {
      if (event?.isPaid && event?.groupDiscount) {
         if (a.discountUnlocked && !b.discountUnlocked) return -1;
         if (!a.discountUnlocked && b.discountUnlocked) return 1;
      }
      const aSpotsLeft = a.targetSize - a.members.length;
      const bSpotsLeft = b.targetSize - b.members.length;
      return aSpotsLeft - bSpotsLeft;
    });

  const totalMembers = eventGroups.reduce((acc, g) => acc + g.members.length, 0);
  const spotsLeftEvent = (event?.maxParticipants || 100) - totalMembers;

  if (discountFilter) {
    eventGroups = eventGroups.filter(g => g.discountUnlocked);
  }
  if (groupSizeFilter !== 'All') {
    if (groupSizeFilter === '6+') {
      eventGroups = eventGroups.filter(g => g.targetSize >= 6);
    } else {
      eventGroups = eventGroups.filter(g => g.targetSize === parseInt(groupSizeFilter));
    }
  }

  const organizer = event ? mockUsers.find(u => u.id === event.organizerId) : null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
  };

  if (isLoading) {
    return <EventDetailSkeleton />;
  }

  if (!event) return <div className="p-8 text-center text-gray-500 font-medium">Event not found</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-[#111827]"
          >
            &larr; Back to Discover
          </button>
          
          <div className="flex gap-2 flex-wrap justify-end">
            <button 
              onClick={handleSave}
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider transition-colors px-3 py-1 rounded-full ${isSaved ? 'text-indigo-800 bg-indigo-100' : 'text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100'}`}
            >
              <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? "Saved" : "Save Event"}
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-full"
            >
              <Share className="h-3.5 w-3.5" />
              {isCopied ? "Link Copied!" : "Share Event"}
            </button>
            <button 
              onClick={() => { alert('Added to Calendar'); }}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-600 hover:text-indigo-600 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full"
            >
              <Calendar className="h-3.5 w-3.5" />
              Add to Calendar
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="neutral">{event.category}</Badge>
          {event.isPaid ? (
            <Badge variant="outline" icon={<Ticket className="h-3 w-3" />}>€{event.price}</Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
          {event.groupDiscount && (
             <Badge variant="success" icon={<CheckCircle className="h-3 w-3" />}>
               -{event.groupDiscount.percentage}% off for {event.groupDiscount.minSize}+ people
             </Badge>
          )}
          {event.minTrustTierAccess === '3_high_trust' && (
            <Badge variant="outline" className="text-indigo-700 font-bold bg-indigo-50 border-indigo-100" icon={<ShieldCheck className="h-3 w-3" />}>Verified Access</Badge>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">{event.title}</h1>
        
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {event.tags.map(tag => (
              <span key={tag} className="flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                <Hash className="h-3 w-3 mr-0.5 text-gray-400" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column: Details */}
        <div className="space-y-8 md:col-span-2">
          <section className="space-y-4 text-sm text-[#111827] leading-relaxed bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase tracking-wider text-sm">
                    <Calendar className="h-3 w-3" /> Date
                  </div>
                  <p className="font-medium">{format(parseISO(event.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase tracking-wider text-sm">
                    <Clock className="h-3 w-3" /> Time
                  </div>
                  <p className="font-medium">{event.time} ({event.duration})</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{event.timeZone || 'Local Time'}</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase tracking-wider text-sm">
                      <MapPin className="h-3 w-3" /> Location
                    </div>
                    <p className="font-medium">{event.locationArea}</p>
                    <p className="text-sm text-gray-400 mt-0.5">Exact meeting point revealed upon confirmation.</p>
                  </div>
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden relative">
                    {/* Placeholder static map */}
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop" alt="Map Preview" className="w-full h-full object-cover opacity-80 mix-blend-luminosity" />
                    <div className="absolute inset-0 bg-indigo-600/10"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.8)]"></div>
                    </div>
                  </div>
                </div>
                 <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-500 font-bold uppercase tracking-wider text-sm">
                    <ShieldCheck className="h-3 w-3" /> Participation Rules
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium capitalize">{event.minTrustTierAccess.split('_')[1].replace('high', 'verified')} account required</p>
                    <Link to="/trust" className="text-sm text-indigo-600 font-bold underline">Why?</Link>
                  </div>
                </div>
             </div>
             
             <div className="pt-4 border-t border-gray-200">
               <h3 className="text-sm font-bold text-[#111827] mb-2 uppercase tracking-wide">About the experience</h3>
               <p className="text-xs text-gray-600">{event.description}</p>
             </div>
             
             {/* High Trust / Outdoor Template Mock */}
             {(event.category === 'Hiking' || event.category === 'Nearby escapes') && (
               <div className="pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-2">
                 <h3 className="text-sm font-bold text-[#111827] mb-3 uppercase tracking-wide">Adventure Details</h3>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg">
                     <div className="text-[10px] uppercase font-bold text-indigo-600 mb-1">Difficulty</div>
                     <div className="text-xs font-bold text-gray-800">{event.category === 'Hiking' ? 'Moderate / Terrain' : 'Easy / Leisure'}</div>
                   </div>
                   <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg">
                     <div className="text-[10px] uppercase font-bold text-indigo-600 mb-1">Equipment / Notes</div>
                     <div className="text-xs font-bold text-gray-800">{event.category === 'Hiking' ? 'Hiking boots required. Bring water.' : 'Overnight stay. Shared expenses.'}</div>
                   </div>
                 </div>
               </div>
             )}
             
             {organizer && (
               <div className="pt-4 border-t border-gray-200">
                 <h3 className="text-sm font-bold text-[#111827] mb-2 uppercase tracking-wide">Organized By</h3>
                 <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      {organizer.photoUrl ? (
                        <img src={organizer.photoUrl} alt={organizer.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">{organizer.name.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <div>
                      <Link to={`/organizer/${organizer.id}`} className="font-bold text-[#111827] hover:text-indigo-600 transition-colors block">
                        {organizer.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{organizer.bio || 'Verified Organizer'}</p>
                    </div>
                 </div>
               </div>
             )}
          </section>

          {/* Contextual Context Note */}
          <section className="rounded-xl border border-gray-100 bg-gray-50/50 p-5 text-sm">
            <h3 className="font-bold text-[#111827] mb-3">Why this group is reliable</h3>
            <ul className="space-y-2.5 text-gray-600">
              <li className="flex items-start gap-2 text-xs">
                <Users className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">Small group constraint.</strong> Kept to {event.maxParticipants || '3-6'} people for better coordination and comfort.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">Confirmed participation.</strong> Users must commit to join. No-shows are tracked internally.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">Public meeting point.</strong> Exact meeting location is revealed only after the group is confirmed.</span>
              </li>
              <li className="flex items-start gap-2 text-xs">
                <CheckCircle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <span><strong className="text-gray-700">Private reports.</strong> Any inappropriate behavior can be reported privately and affects reliability scores.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Right Column: Groups & Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-24">
            <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-4">Auto-Suggest Small Groups</h3>
            <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center text-sm font-bold text-indigo-900">
              <span className="flex items-center gap-1.5"><Ticket className="h-4 w-4" /> Overall Event Capacity</span>
              <span>{Math.max(0, spotsLeftEvent)} spots left</span>
            </div>
            
            <div className="flex flex-col gap-3 mb-6">
              <Button className="w-full bg-indigo-600 text-white hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2" size="lg" onClick={() => navigate(`/events/${eventId}/join`)}>
                <Users className="w-5 h-5" />
                Create New Group
              </Button>
            </div>
            
            {(eventGroups.length > 0 || groupSizeFilter !== 'All' || discountFilter) && (
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold uppercase text-gray-500 mt-1.5">Filter by:</span>
                  <div className="flex flex-wrap gap-2 flex-1">
                    <select 
                      value={groupSizeFilter} 
                      onChange={(e) => setGroupSizeFilter(e.target.value as any)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded p-1 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="All">Any Size</option>
                      <option value="3">3 Members</option>
                      <option value="4">4 Members</option>
                      <option value="5">5 Members</option>
                      <option value="6+">6+ Members</option>
                    </select>
                    {event.isPaid && event.groupDiscount && (
                      <button 
                        onClick={() => setDiscountFilter(!discountFilter)}
                        className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${discountFilter ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        Discount Only
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed">
              We highly recommend joining or creating groups of 3-5 users to reduce awkwardness and ensure the event happens safely.
            </p>
            
            {eventGroups.length === 0 ? (
              <div className="text-xs text-gray-500 mb-6 bg-gray-50 p-4 rounded-xl text-center border border-dashed border-gray-200 font-medium">
                No groups forming yet. Be the first to start one!
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {eventGroups.map(group => (
                  <Group key={group.id} group={group} event={event} navigate={navigate} />
                ))}
              </div>
            )}
            
            <div className="space-y-4 pt-5 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50" size="lg" onClick={() => alert("Added to waitlist. We will notify you if a spot in a group opens up.")}>
                  Join Waitlist
                </Button>
              </div>
              <div className="text-[10px] text-gray-500 font-medium bg-gray-50 rounded text-center p-3 leading-relaxed uppercase tracking-wider">
                Create a new 3-5 person group. 
                {event.isPaid ? (
                  <span className="block mt-1 font-bold text-gray-700">Payment pre-authorized via official partner APIs. Discharges automatically on Group confirmation.</span>
                ) : (
                  <span className="block mt-1 font-bold">Free to start.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
