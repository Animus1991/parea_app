import React from 'react';
import { ShieldCheck, UserCheck, Smartphone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function VerificationCenter() {
  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">Identity Verification</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Build trust within the community.</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-4 mt-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
           <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h2 className="font-bold text-emerald-900 text-sm">Your Trust Score is High</h2>
          <p className="text-xs text-emerald-700 mt-1 mb-3">You've completed the basic verification steps. Complete the remaining steps to unlock hosting capabilities and higher group limits.</p>
          <div className="w-full bg-emerald-200 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-sm text-[#111827]">Email Address</h3>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Verified</p>
                 </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
           </div>
        </Card>

        <Card className="p-5">
           <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-sm text-[#111827]">Phone Number</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Not Verified</p>
                 </div>
              </div>
           </div>
           <p className="text-xs text-gray-500 mb-3">Required for joining premium events and receiving host updates.</p>
           <Button variant="outline" size="sm" className="w-full text-xs">Verify Phone</Button>
        </Card>

        <Card className="p-5 md:col-span-2">
           <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gray-50 text-gray-400 border border-gray-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-sm text-[#111827]">Government ID / KYC</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Not Verified</p>
                 </div>
              </div>
              <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Required to Host</span>
           </div>
           <p className="text-sm text-gray-500 mb-4 max-w-xl">
             To ensure the highest safety standards in our real-world ecosystem, organizers and attendees of private events must verify their government-issued ID. Your data is encrypted and handled by our approved KYC partner.
           </p>
           <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-dashed border-gray-200">
             <div className="flex gap-3 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Bank-level security</span>
                <span className="flex items-center gap-1"><UserCheck className="w-4 h-4"/> Takes 2 minutes</span>
             </div>
             <Button size="sm" className="w-full sm:w-auto shrink-0 shadow-sm">Start ID Verification</Button>
           </div>
        </Card>
      </div>
    </div>
  );
}
