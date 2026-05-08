import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AlertCircle, UserMinus, ShieldAlert, Flag, Search, CheckCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useLanguage } from "../lib/i18n";

export default function AdminDashboard() {
    const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-full space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-red-700"></h1>
        <p className="mt-1 text-xs text-gray-500 font-medium"></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-t-4 border-t-blue-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider"></h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">12</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-cyan-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider"></h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">4</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-red-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider"></h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">1</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10">
        
        <div className="md:col-span-7 space-y-6">
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide"></h2>
          <div className="space-y-4">
            <Card className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                 <div className="mt-1"><AlertCircle className="h-4 w-4 text-yellow-500" /></div>
                 <div>
                   <p className="font-bold text-[#111827] text-sm"></p>
                   <p className="text-xs text-gray-500 mt-0.5 leading-relaxed"></p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button className="text-sm uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded font-bold transition-colors shadow-sm border border-gray-200"></button>
                <button className="text-sm uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold transition-colors border border-red-200"></button>
              </div>
            </Card>

            <Card className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-200 bg-red-50/30">
              <div className="flex items-start gap-3">
                 <div className="mt-1"><ShieldAlert className="h-4 w-4 text-red-500" /></div>
                 <div>
                   <p className="font-bold text-[#111827] text-sm"></p>
                   <p className="text-xs text-gray-500 mt-0.5 leading-relaxed"></p>
                 </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="text-sm uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-colors"></button>
              </div>
            </Card>
          </div>
        </div>

        <div className="md:col-span-5 relative">
          <div className="sticky top-24">
            <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-6 flex items-center gap-2">
              <Flag className="h-4 w-4 text-gray-400" /></h2>
            <Card className="p-5 bg-gray-50 border-gray-200">
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-4"></p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#111827] mb-1.5 block"></label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder="" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] mb-1.5 block"></label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-none bg-white">
                    <option></option>
                    <option></option>
                    <option></option>
                    <option></option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-[#111827] mb-1.5 block"></label>
                  <textarea rows={3} placeholder="" className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-none resize-none"></textarea>
                </div>
                
                <Button className="w-full bg-[#111827]"></Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
