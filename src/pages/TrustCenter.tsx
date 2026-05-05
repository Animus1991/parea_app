import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ShieldCheck, Phone, Mail, CreditCard, Award, UserCheck } from 'lucide-react';
import { currentUser } from '../data/mockUsers';

export default function TrustCenter() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">How groups work</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-xl">
          Nakamas is an event companion platform built to help you find company for the experiences you love. We rely on clear organization, small group coordination, and verified access to ensure everyone has a comfortable time.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         {/* Current Status */}
         <Card className="p-4 space-y-6">
           <div>
             <h2 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest mb-4 flex items-center gap-2">
               <ShieldCheck className="h-4 w-4 text-green-600" /> My Trust Status
             </h2>
             <p className="text-sm font-bold text-[#111827]">Tier 5 - Highly Reliable</p>
           </div>
           
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600">
                 <Mail className="h-4 w-4 text-gray-400" /> Email
               </div>
               <Badge variant="success">Verified</Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600">
                 <Phone className="h-4 w-4 text-gray-400" /> Phone
               </div>
               <Badge variant="success">Verified</Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600">
                 <CreditCard className="h-4 w-4 text-gray-400" /> Payment
               </div>
               <Badge variant="success">Verified</Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-400">
                 <UserCheck className="h-4 w-4 text-gray-300" /> Government ID
               </div>
               <span className="text-[10px] text-indigo-600 font-bold cursor-pointer hover:underline uppercase">Verify Now</span>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
                 <Award className="h-4 w-4 text-yellow-500" /> Reliability Score
               </div>
               <span className="text-xs font-bold text-green-600">{currentUser.reliabilityScore}%</span>
             </div>
             <p className="text-sm text-gray-500 mt-2">Earned through showing up to events on time.</p>
           </div>
         </Card>

         {/* Info */}
         <div className="space-y-4">
            <Card className="p-4 bg-gray-50 border-none shadow-none">
              <h3 className="text-[11px] font-bold text-[#111827] uppercase tracking-wide mb-2">Group Coordination</h3>
              <p className="text-xs text-gray-600">Events are public, but your specific group is private. Some activities (like hikes and private venues) require verified participation to ensure a structured, reliable group dynamic.</p>
            </Card>
            <Card className="p-4 bg-gray-50 border-none shadow-none">
              <h3 className="text-[11px] font-bold text-[#111827] uppercase tracking-wide mb-2">Privacy first</h3>
              <p className="text-xs text-gray-600">We never show your phone, email, or payment details to other users. You only share your profile with your confirmed group when and if you choose to.</p>
            </Card>
            <Card className="p-4 bg-gray-50 border-none shadow-none">
              <h3 className="text-[11px] font-bold text-[#111827] uppercase tracking-wide mb-2">No public person ratings</h3>
              <p className="text-xs text-gray-600">We do not use star ratings for people. We track no-shows internally and give everyone a reliability score, which helps ensure group quality.</p>
            </Card>
         </div>
      </div>
    </div>
  );
}
