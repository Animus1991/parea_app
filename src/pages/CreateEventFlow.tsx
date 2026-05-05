import React, { useState } from 'react';
import { Camera, MapPin, Clock, Calendar, Users, Target, Lock, Globe, CheckCircle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function CreateEventFlow() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111827]">Create Experience</h1>
        <p className="text-gray-500 text-sm mt-1">Design your perfect real-world gathering.</p>
        
        <div className="flex items-center gap-2 mt-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>

      <Card className="p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-lg font-bold text-[#111827]">The Basics</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Event Title</label>
                <input type="text" placeholder="e.g. Sunday Morning Hike & Coffee" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all bg-white">
                  <option>Select a category...</option>
                  <option>Hiking & Outdoors</option>
                  <option>Board Games</option>
                  <option>Stand-up Comedy</option>
                  <option>Theatre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Description</label>
                <textarea rows={4} placeholder="What are we going to do? What should people expect?" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all resize-none"></textarea>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full">Next: When & Where</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-lg font-bold text-[#111827]">When & Where</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Time</label>
                  <input type="time" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</label>
                <div className="relative">
                   <input type="text" placeholder="Search venue or address..." className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all" />
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <div className="h-32 bg-gray-100 rounded-lg mt-2 border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">Map Preview</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-[2]">Next: Group Dynamics</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <h2 className="text-lg font-bold text-[#111827]">Group Dynamics</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-3">Visibility</label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${visibility === 'public' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-200'}`}
                    onClick={() => setVisibility('public')}
                  >
                    <Globe className={`w-5 h-5 mb-2 ${visibility === 'public' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <h4 className="text-sm font-bold text-[#111827] mb-1">Public</h4>
                    <p className="text-[10px] text-gray-500">Anyone can find and request to join.</p>
                  </div>
                  <div 
                    className={`border rounded-xl p-4 cursor-pointer transition-all ${visibility === 'private' ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-indigo-200'}`}
                    onClick={() => setVisibility('private')}
                  >
                    <Lock className={`w-5 h-5 mb-2 ${visibility === 'private' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <h4 className="text-sm font-bold text-[#111827] mb-1">Private</h4>
                    <p className="text-[10px] text-gray-500">Only visible via direct invite link.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Group Size limit</label>
                <div className="flex items-center gap-3">
                   <input type="number" min="2" max="50" defaultValue="4" className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none text-center" />
                   <span className="text-sm text-gray-500 font-medium">people maximum</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-[2]">Next: Review</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                 <CheckCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-[#111827]">Ready to Publish!</h2>
              <p className="text-sm text-gray-500 mt-1">Review your event details before sharing.</p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
               <div className="flex justify-between pb-3 border-b border-gray-200">
                 <span className="text-gray-500 font-medium">Title</span>
                 <span className="font-bold text-[#111827]">Sunday Hike</span>
               </div>
               <div className="flex justify-between pb-3 border-b border-gray-200">
                 <span className="text-gray-500 font-medium">Date & Time</span>
                 <span className="font-bold text-[#111827]">Oct 24, 10:00 AM</span>
               </div>
               <div className="flex justify-between pb-3 border-b border-gray-200">
                 <span className="text-gray-500 font-medium">Visibility</span>
                 <span className="font-bold text-[#111827] capitalize">{visibility}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-gray-500 font-medium">Capacity</span>
                 <span className="font-bold text-[#111827]">4 spots</span>
               </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-sm text-amber-800">
              <Target className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs">Once published, attendees can start joining. You can manually approve requests or set it to auto-approve.</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
              <Button className="flex-[2]">Publish Experience</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
