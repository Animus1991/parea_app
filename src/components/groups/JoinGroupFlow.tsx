import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockEvents } from '../../data/mockEvents';
import { Button } from '../common/Button';
import { Ticket, Users, CheckCircle, Split, ShieldCheck, Tag } from 'lucide-react';

export default function JoinGroupFlow() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find(e => e.id === eventId);
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState<'existing' | 'new'>('new');
  const [newGroupSize, setNewGroupSize] = useState(4);

  if (!event) return null;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 mt-8">
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Join or Create a Group</h2>
            <p className="mt-1 text-sm text-gray-500 font-medium">{event.title}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Time Zone: {event.timeZone || 'Local Time'}</p>
          </div>
          
          <p className="text-xs text-gray-600 font-medium mt-2 p-3 bg-indigo-50 border border-indigo-100 rounded text-indigo-900 leading-relaxed">
            Nakamas highly recommends groups of 3-5 people. Groups are less awkward, safer{event.isPaid && event.groupDiscount ? `, and groups of ${event.groupDiscount.minSize} or more receive an automatic ${event.groupDiscount.percentage}% discount on paid tickets once confirmed!` : '!'}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <button 
              onClick={() => setGroupType('existing')}
              className={`p-4 rounded-xl border text-left transition-all ${groupType === 'existing' ? 'border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <Users className={`h-5 w-5 mb-2 ${groupType === 'existing' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="font-bold text-sm text-[#111827]">Join Existing</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Jump into a small group that's already gathering.</p>
            </button>
            <button 
              onClick={() => setGroupType('new')}
              className={`p-4 rounded-xl border text-left transition-all ${groupType === 'new' ? 'border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <Split className={`h-5 w-5 mb-2 ${groupType === 'new' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="font-bold text-sm text-[#111827]">Start New Group</p>
              <p className="text-sm text-gray-500 font-medium mt-1">Gather a fresh group of users to attend.</p>
            </button>
          </div>
          
          {groupType === 'new' && (
            <div className="pt-4 space-y-3">
               <label className="text-xs font-bold text-[#111827] uppercase tracking-wide">Target Group Size</label>
               <div className="flex gap-2">
                 {[3,4,5,6].map(size => (
                   <button 
                     key={size}
                     onClick={() => setNewGroupSize(size)}
                     className={`flex-1 py-2 text-xs font-bold rounded border ${newGroupSize === size ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                   >
                     {size} People
                     {event.isPaid && event.groupDiscount && size >= event.groupDiscount.minSize && <Tag className="h-3 w-3 inline ml-1" />}
                   </button>
                 ))}
               </div>
               
               <div className="mt-4 flex items-center justify-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl shadow-inner">
                 <div className="text-center">
                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Selected Target Size</p>
                   <div className="flex items-center justify-center gap-1.5 text-indigo-900 font-bold text-lg">
                     <Users className="w-4 h-4 text-indigo-600" />
                     {newGroupSize} <span className="text-xs font-medium text-indigo-700">Members</span>
                   </div>
                 </div>
               </div>
               {event.isPaid && event.groupDiscount && newGroupSize >= event.groupDiscount.minSize && (
                 <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 shadow-sm transform transition-all duration-300 scale-100">
                   <div className="p-2.5 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                     <Tag className="h-5 w-5" />
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-widest leading-tight">Discount Unlocked!</h4>
                     <p className="text-xs text-emerald-700 font-medium mt-1">
                       Awesome! By starting a group of {newGroupSize}, everyone (including you) gets <span className="font-bold text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded">{event.groupDiscount.percentage}% OFF</span> the ticket price.
                     </p>
                   </div>
                 </div>
               )}
            </div>
          )}

          <Button className="w-full mt-6" size="lg" onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
               {event.isPaid ? 'Secure Your Spot via Partner' : 'Commitment Confirmation'}
            </h2>
            <p className="mt-1 text-xs text-gray-500 font-medium bg-gray-50 p-2 rounded inline-block mt-2">
               {groupType === 'new' ? `Starting new group of ${newGroupSize}` : 'Joining existing group'}
            </p>
          </div>

          {event.isPaid ? (
            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Ticket Price</span>
                <span className="font-bold">€{event.price.toFixed(2)}</span>
              </div>
              
              {event.groupDiscount && newGroupSize >= event.groupDiscount.minSize && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> Group Booking Discount ({event.groupDiscount.percentage}%)</span>
                  <span>-€{(event.price * (event.groupDiscount.percentage / 100)).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nakamas Coordination Fee</span>
                <span className="font-bold">€1.50</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg text-indigo-600">
                <span>Total Charge</span>
                <span>€{((event.groupDiscount && newGroupSize >= event.groupDiscount.minSize ? event.price * (1 - event.groupDiscount.percentage / 100) : event.price) + 1.5).toFixed(2)}</span>
              </div>
              <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded font-bold uppercase tracking-wider flex items-start gap-2 mt-4 leading-relaxed">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                No Web Scraping! Payment is pre-authorized and processed through official API affiliate integration (e.g. more.com) once the group is confirmed.
              </div>
            </div>
          ) : (
             <div className="space-y-4">
               <div className="text-xs text-gray-600 font-medium bg-indigo-50 border border-indigo-200 p-4 rounded-xl" style={{ backgroundColor: "rgb(254 242 242)", borderColor: "rgb(252 165 165)", color: "rgb(153 27 27)" }}>
                 <strong>Mandatory Commitment:</strong> This is a free event, but your spot is valuable. By confirming below, you make a strict commitment to attend. If you fail to show up without a valid reason, your internal reliability score will severely decrease, which may limit your access to future events and high-trust activities.
               </div>
               <div className="rounded-xl border border-gray-200 p-4">
                 <div className="flex justify-between text-sm font-bold text-indigo-600">
                   <span>Registration Status</span>
                   <span>Pending Confirmation</span>
                 </div>
               </div>
             </div>
          )}

          <Button className="w-full" size="lg" onClick={() => setStep(3)}>
            {event.isPaid ? 'Pre-Authorize with Partner' : 'I Commit to Attend'}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
            <CheckCircle className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#111827]">You're In!</h2>
            <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
              Your {event.isPaid && 'payment hold is active and your'} spot is reserved. The group chat is now open. We'll send you the exact meeting location 24h before the event happens.
            </p>
          </div>
          <div className="pt-6 space-y-3">
             <Button className="w-full" size="lg" onClick={() => navigate('/plans')}>
               Go To My Plans
             </Button>
             <Button variant="ghost" className="w-full border border-gray-200" onClick={() => navigate(`/events/${eventId}`)}>
               Back to Event
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
