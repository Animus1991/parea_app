import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Calendar, Users, MessageSquare, Plus, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "../lib/i18n";

export default function OrganizerDashboard() {
    const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-full space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]"></h1>
          <p className="mt-1 text-xs text-gray-500 font-medium"></p>
        </div>
        <Button className="bg-[#111827] text-white flex items-center gap-2 text-xs font-bold px-4 hover:bg-black">
          <Plus className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-t-4 border-t-cyan-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider"></h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">3</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-emerald-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider"></h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">48</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-amber-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider"></h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">5</p>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide"></h2>
        
        <Card className="p-0 overflow-hidden border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                 <Badge variant="neutral"></Badge>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider"></span>
               </div>
               <h3 className="text-sm font-bold text-[#111827]"></h3>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100"></span>
            </div>
          </div>
          
          <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Groups Panel */}
             <div className="md:col-span-2 space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <Users className="w-4 h-4 text-gray-400" /></h4>
               
               <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700"></p>
                    <p className="text-[10px] text-gray-500 mt-0.5"></p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white text-cyan-600 rounded shadow-sm border border-gray-200 hover:bg-cyan-50">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700"></p>
                    <p className="text-[10px] text-gray-500 mt-0.5"></p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white text-cyan-600 rounded shadow-sm border border-gray-200 hover:bg-cyan-50">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
             </div>

             {/* Actions */}
             <div className="space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-gray-400" /></h4>
               <Button variant="outline" className="w-full text-xs" size="sm"></Button>
               <Button variant="outline" className="w-full text-xs" size="sm"></Button>
               <Button variant="outline" className="w-full text-xs bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100" size="sm"></Button>
               <Button variant="ghost" className="w-full text-xs text-red-600 hover:bg-red-50 hover:text-red-700" size="sm"></Button>
             </div>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden border border-gray-200">
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                 <Badge variant="neutral"></Badge>
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider"></span>
               </div>
               <h3 className="text-sm font-bold text-[#111827]"></h3>
            </div>
            <div className="flex gap-2">
              <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded shadow-sm border border-gray-100"></span>
            </div>
          </div>
          
          <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="md:col-span-2 space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <Users className="w-4 h-4 text-gray-400" /></h4>
               
               <div className="flex items-center justify-between p-3 bg-cyan-50 rounded border border-cyan-100">
                  <div>
                    <p className="text-xs font-bold text-cyan-900"></p>
                    <p className="text-[10px] text-cyan-600 mt-0.5"></p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-1.5 bg-white text-cyan-600 rounded shadow-sm border border-cyan-200 hover:bg-cyan-100 relative">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                  </div>
               </div>
             </div>

             <div className="space-y-3">
               <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                 <MoreHorizontal className="w-4 h-4 text-gray-400" /></h4>
               <Button variant="outline" className="w-full text-xs" size="sm"></Button>
               <Button variant="outline" className="w-full text-xs" size="sm"></Button>
             </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
