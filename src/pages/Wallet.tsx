import React from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useLanguage } from "../lib/i18n";

export default function Wallet() {
    const { t } = useLanguage();
  const transactions = [
    { id: '1', type: 'Payout', amount: 120.00, status: t(`Ολοκληρώθηκε`, `Completed`), date: '12 Οκτ 2024', desc: t(`Μεταφορά σε τράπεζα ****4092`, `Transfer to Bank ending in 4092`) },
    { id: '2', type: 'Earnings', amount: 45.00, status: t(`Διαθέσιμο`, `Available`), date: '10 Οκτ 2024', desc: t(`Πωλήσεις εισιτηρίων: Yoga in the Park`, `Ticket sales: Yoga in the Park`) },
    { id: '3', type: 'Earnings', amount: 25.00, status: t(`Σε επεξεργασία`, `Processing`), date: '14 Οκτ 2024', desc: t(`Πωλήσεις εισιτηρίων: Comedy Night`, `Ticket sales: Comedy Night`) },
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">{t(`Πορτοφόλι & Πληρωμές`, `Wallet & Payments`)}</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">{t(`Διαχείριση εσόδων και πληρωμών`, `Manage earnings and payments`)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-cyan-600 text-white border-0 shadow-sm">
          <div className="flex items-center gap-2 text-cyan-100 mb-2">
            <DollarSign className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t(`Διαθέσιμο Υπόλοιπο`, `Available Balance`)}</h3>
          </div>
          <p className="text-2xl font-black mb-4">€345.50</p>
          <Button className="w-full bg-white text-cyan-900 hover:bg-gray-100 border-0">{t(`Ανάληψη`, `Withdraw`)}</Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Clock className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">{t(`Σε Εκκρεμότητα`, `Pending`)}</h3>
          </div>
          <p className="text-xl font-bold text-gray-800 mb-2">€85.00</p>
          <p className="text-[10px] text-gray-400 font-medium leading-tight">{t(`Θα είναι διαθέσιμα σε 2-3 εργάσιμες`, `Will be available in 2-3 business days`)}</p>
        </Card>

        <Card className="p-6 border border-gray-200 bg-gray-50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-10 h-10 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center text-gray-500">
                <Building2 className="w-5 h-5" />
             </div>
             <div>
                <h3 className="font-bold text-sm text-[#111827]">{t(`Τραπεζικός Λογαριασμός`, `Bank Account`)}</h3>
                <p className="text-xs text-gray-500 font-medium">Chase ****4092</p>
             </div>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs">{t(`Αλλαγή Λογαριασμού`, `Change Account`)}</Button>
        </Card>
      </div>

      <Card className="mt-8">
         <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#111827]">{t(`Ιστορικό Συναλλαγών`, `Transaction History`)}</h2>
            <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none">
              <option>{t(`Όλες`, `All`)}</option>
              <option>{t(`Έσοδα`, `Earnings`)}</option>
              <option>{t(`Αναλήψεις`, `Payouts`)}</option>
            </select>
         </div>
         <div className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'Payout' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                       {tx.type === 'Payout' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                       <h4 className="font-bold text-[#111827] text-sm">{tx.desc}</h4>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{tx.date}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <span className="text-[10px] text-gray-500 font-medium flex items-center justify-center gap-1">
                            {tx.id !== '3' ? <CheckCircle2 className="w-3 h-3 text-emerald-500"/> : <Clock className="w-3 h-3 text-amber-500"/>}
                            {tx.status}
                          </span>
                       </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className={`font-bold ${tx.type === 'Payout' ? 'text-[#111827]' : 'text-emerald-600'}`}>
                      {tx.type === 'Payout' ? '-' : '+'}€{tx.amount.toFixed(2)}
                    </p>
                 </div>
              </div>
            ))}
         </div>
      </Card>
    </div>
  );
}
