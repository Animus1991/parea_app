import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Skeleton, ProfileSkeleton } from '../components/common/Skeleton';
import { currentUser } from '../data/mockUsers';
import { Shield, ShieldCheck, CheckCircle2, History, Camera, Edit2, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState(currentUser.photoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bio, setBio] = useState('Passionate about finding cool local events and meeting new people.');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(bio);

  const [interests, setInterests] = useState(currentUser.interests);
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Create a temporary object URL to simulate immediate upload feedback
      const newUrl = URL.createObjectURL(e.target.files[0]);
      setPhotoUrl(newUrl);
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-full px-4 py-8"><ProfileSkeleton /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#111827]">Profile</h1>
        <p className="mt-1 text-xs text-gray-500 font-medium leading-relaxed">Manage your trust settings, verifications, and history.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="relative group">
            <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 overflow-hidden">
               {photoUrl ? (
                 <img referrerPolicy="no-referrer" src={photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-indigo-700 font-bold text-xl uppercase">{currentUser.name.substring(0, 2)}</span>
               )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              title="Upload profile picture"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handlePhotoUpload}
            />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-lg font-bold text-[#111827]">{currentUser.name}</h2>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500 font-medium">
              <span>{currentUser.ageRange}</span>
              <span>•</span>
              <span>{currentUser.city}</span>
            </div>
            
            <div className="mt-3">
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea 
                    value={tempBio} 
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setBio(tempBio); setIsEditingBio(false); }}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => { setTempBio(bio); setIsEditingBio(false); }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="group relative">
                  <p className="text-sm text-gray-600 font-medium pr-8">{bio}</p>
                  <button 
                    onClick={() => setIsEditingBio(true)}
                    className="absolute top-0 right-0 p-1 text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-gray-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className={`text-xs py-1 px-2.5 shadow-sm ${currentUser.reliabilityScore >= 80 ? 'text-green-700 bg-green-50 border-green-200' : currentUser.reliabilityScore >= 50 ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                <ShieldCheck className="h-4 w-4 mr-1.5 inline" />
                {currentUser.reliabilityScore}% Reliability Score
              </Badge>
              <Badge variant="outline" className={`text-xs py-1 px-2.5 shadow-sm ${currentUser.trustTier === '3_high_trust' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-gray-700 bg-gray-50 border-gray-200'}`}>
                {currentUser.trustTier === '3_high_trust' ? 'High Trust Tier' : currentUser.trustTier.replace(/_/g, ' ').toUpperCase() + ' Tier'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm">Edit</Button>
            {currentUser.isOrganizer ? (
              <Button size="sm" onClick={() => navigate(`/organizer/${currentUser.id}`)}>My Organizer Profile</Button>
            ) : (
               <Button size="sm" variant="ghost" onClick={() => alert('Redirecting to Organizer Registration...')}>Become an Organizer</Button>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Identity Tiers & Permissions</h3>
          <div className="space-y-3">
             <div className="flex items-center gap-3">
               <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="h-4 w-4 text-emerald-600" />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-bold text-[#111827]">Tier 1: Explorer</p>
                 <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">Email/Phone verified. Can view and join Public Free Events.</p>
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                 <CheckCircle2 className="h-4 w-4 text-emerald-600" />
               </div>
               <div className="flex-1 border border-emerald-200 bg-emerald-50/50 p-2 rounded">
                 <p className="text-sm font-bold text-emerald-800">Tier 2: Confirmed</p>
                 <p className="text-[10px] text-emerald-600/80 uppercase font-bold tracking-wide">Payment Method added or first Ticket Purchased. Can join Paid/Small Group Events.</p>
               </div>
             </div>

             <div className="flex items-center gap-3">
               <div className="h-6 w-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                 <Shield className="h-4 w-4 text-gray-400" />
               </div>
               <div className="flex-1">
                 <p className="text-sm font-bold text-gray-700">Tier 3: High Trust</p>
                 <p className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">Identity/Selfie verified + Positive Reliability Score. Access to Private/Home events and Hiking/Trips.</p>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Group Preferences</h3>
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-3 border border-indigo-200 bg-indigo-50/30 rounded-xl cursor-pointer">
              <input type="radio" name="groupsize" defaultChecked className="mt-0.5 h-4 w-4 text-indigo-600 rounded-full border-indigo-300" />
              <div>
                <span className="text-sm font-bold text-indigo-900 block">Default: Groups (3-5 people)</span>
                <span className="text-xs text-indigo-700/80 font-medium leading-relaxed block mt-1">Recommended. Nakamas works best in small groups to remove awkwardness and increase safety.</span>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer opacity-75">
              <input type="radio" name="groupsize" disabled className="mt-0.5 h-4 w-4 text-gray-400 rounded-full border-gray-300" />
              <div>
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-gray-700 block">1-on-1 Experiences</span>
                   <Badge variant="neutral">Tier 3 Req</Badge>
                 </div>
                <span className="text-xs text-gray-500 font-medium leading-relaxed block mt-1">Requires High Trust Tier to unlock.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
             <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">History & Reviews</h3>
             <Button variant="ghost" size="sm" onClick={() => navigate('/plans')} className="text-indigo-600 font-bold hover:bg-indigo-50">View All</Button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                 <History className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-sm font-bold text-[#111827]">Past Events & Private Feedback</p>
                  <p className="text-xs text-gray-500 font-medium">Review your experiences privately</p>
               </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/plans')}>Review</Button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Interests</h3>
          <div className="flex flex-wrap gap-2 items-center">
            {interests.map(i => (
              <Badge key={i} variant="neutral" className="pr-1.5 select-none bg-gray-50 border-gray-200 text-gray-700">
                {i}
                <button 
                  onClick={() => setInterests(interests.filter(int => int !== i))}
                  className="ml-1.5 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            
            {isAddingInterest ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newInterest.trim() && !interests.includes(newInterest.trim())) {
                    setInterests([...interests, newInterest.trim()]);
                    setNewInterest('');
                    setIsAddingInterest(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="New interest..."
                  className="text-xs border border-gray-200 rounded px-2 py-1 w-28 focus:outline-none focus:border-indigo-500"
                  autoFocus
                  onBlur={() => {
                    if (!newInterest.trim()) setIsAddingInterest(false);
                  }}
                />
                <Button type="submit" size="sm" variant="ghost" className="h-6 px-2 text-indigo-600 font-bold uppercase text-[10px]">Add</Button>
              </form>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-gray-50 border border-gray-200 h-6 px-2 text-xs font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                onClick={() => setIsAddingInterest(true)}
              >
                <Plus className="w-3 h-3" /> Add Interest
              </Button>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Availability Preferences</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral">Weekends</Badge>
            <Badge variant="neutral">Weekday Evenings</Badge>
            <Button variant="ghost" size="sm" className="bg-gray-50 border border-gray-200">+ Edit</Button>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-3">Visibility & Connections</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
              <span className="text-sm text-gray-700 font-medium">Reveal my photo to confirmed groups 2 hours before event</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
              <span className="text-sm text-gray-700 font-medium">Allow mutual "Keep in touch" requests post-event</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 text-indigo-600 rounded border-gray-300" />
              <span className="text-sm text-gray-700 font-medium">Allow organizers to message me after event</span>
            </label>
          </div>
        </div>
      </Card>
      
      <div className="flex justify-center">
        <Button onClick={() => navigate('/login')} variant="ghost" className="text-gray-400 hover:text-red-600 font-bold uppercase tracking-wider text-xs">Sign Out</Button>
      </div>
    </div>
  );
}
