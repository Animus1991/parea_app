import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ShieldCheck, Phone, Mail, CreditCard, Award, UserCheck } from 'lucide-react';
import { currentUser } from '../data/mockUsers';
import { useLanguage } from "../lib/i18n";

export default function TrustCenter() {
    const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#111827] tracking-tight"></h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-600 max-w-xl"></p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         {/* Current Status */}
         <Card className="p-5 space-y-5">
           <div>
             <h2 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-1.5">
               <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /></h2>
             <p className="text-[13px] font-bold text-[#111827]"></p>
           </div>
           
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                 <Mail className="h-3.5 w-3.5 text-gray-400" /> Email
               </div>
               <Badge variant="success" className="text-[9px] px-1.5 py-0.5"></Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                 <Phone className="h-3.5 w-3.5 text-gray-400" /></div>
               <Badge variant="success" className="text-[9px] px-1.5 py-0.5"></Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                 <CreditCard className="h-3.5 w-3.5 text-gray-400" /></div>
               <Badge variant="success" className="text-[9px] px-1.5 py-0.5"></Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                 <UserCheck className="h-3.5 w-3.5 text-gray-300" /></div>
               <span className="text-[9px] text-cyan-600 font-bold cursor-pointer hover:underline uppercase tracking-wider"></span>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-[13px] font-bold text-[#111827]">
                 <Award className="h-4 w-4 text-amber-500" /></div>
               <span className="text-[13px] font-bold text-emerald-600">{currentUser.reliabilityScore}%</span>
             </div>
             <p className="text-[11px] text-gray-500 mt-1.5 font-medium leading-relaxed"></p>
           </div>
         </Card>

         {/* Info */}
         <div className="space-y-3">
             <Card className="p-4 md:p-5 bg-gray-50 border-none shadow-none">
              <h3 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5"></h3>
              <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed"></p>
            </Card>
            <Card className="p-4 md:p-5 bg-gray-50 border-none shadow-none">
              <h3 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5"></h3>
              <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed"></p>
            </Card>
            <Card className="p-4 md:p-5 bg-gray-50 border-none shadow-none">
              <h3 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5"></h3>
              <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed"></p>
            </Card>
         </div>
      </div>
    </div>
  );
}
