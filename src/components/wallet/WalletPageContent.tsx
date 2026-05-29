import React from 'react';
import { CreditCard, Euro, ArrowUpRight, ArrowDownRight, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';

export default function WalletPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();

  const transactions = [
    { id: '1', type: 'Payout', amount: 120.00, status: t('Ολοκληρώθηκε', 'Completed'), date: 'Oct 12, 2024', desc: t('Μεταφορά στην τράπεζα 4092', 'Transfer to Bank ****4092') },
    { id: '2', type: 'Earnings', amount: 45.00, status: t('Διαθέσιμο', 'Available'), date: 'Oct 10, 2024', desc: t('Πωλήσεις: Yoga στο Πάρκο', 'Ticket sales: Yoga in the Park') },
    { id: '3', type: 'Earnings', amount: 25.00, status: t('Σε Επεξεργασία', 'Processing'), date: 'Oct 14, 2024', desc: t('Πωλήσεις: Comedy Night', 'Ticket sales: Comedy Night') },
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Πορτοφόλι & Έσοδα', 'Wallet & Earnings')}</h1>
        <p className={cn("font-medium text-sm mt-1", a.sub)}>{t('Διαχειριστείτε τα έσοδα και τις πληρωμές σας.', 'Manage your event revenue and payouts.')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("p-6 text-white shadow-md", a.balanceBg)}>
          <div className={cn("flex items-center gap-2 mb-2", a.balanceLabel)}>
            <Euro className="w-4 h-4" />
            <h3 className="text-xs font-bold tracking-wide">{t('Διαθέσιμο Υπόλοιπο', 'Available Balance')}</h3>
          </div>
          <p className="text-4xl font-black mb-4">€345.50</p>
          <Button className={cn("w-full", a.withdrawBtn)}>
            {t('Ανάληψη χρημάτων', 'Withdraw Funds')}
          </Button>
        </Card>

        <Card className="p-6">
          <div className={cn("flex items-center gap-2 mb-2", a.sub)}>
            <Clock className="w-4 h-4" />
            <h3 className="text-xs font-bold tracking-wide">{t('Εκκρεμεί', 'Pending')}</h3>
          </div>
          <p className={cn("text-3xl font-bold mb-2", a.head)}>€85.00</p>
          <p className={cn("text-[10px] font-medium leading-tight", a.muted)}>
            {t('Εξοφλούνται 3-5 ημέρες μετά.', 'Clears 3-5 days after event.')}
          </p>
        </Card>

        <Card className={cn("p-6 flex flex-col justify-center border", a.bankBg)}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", a.bankIcon)}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn("font-bold text-sm", a.head)}>{t('Τραπεζικός λογαριασμός', 'Bank Account')}</h3>
              <p className={cn("text-xs font-medium", a.sub)}>Chase ****4092</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs">{t('Διαχείριση', 'Manage Payouts')}</Button>
        </Card>
      </div>

      <Card className="mt-2">
        <div className={cn("p-4 md:p-6 border-b flex items-center justify-between", a.borderB)}>
          <h2 className={cn("text-base font-bold", a.head)}>{t('Πρόσφατες Συναλλαγές', 'Recent Transactions')}</h2>
          <select className={cn("text-xs border rounded-lg px-2 py-1 outline-none", a.selectBg)}>
            <option>{t('Όλες', 'All Time')}</option>
            <option>{t('Αυτόν τον Μήνα', 'This Month')}</option>
            <option>{t('Προηγούμενο', 'Last Month')}</option>
          </select>
        </div>
        <div className={a.divider}>
          <div className={cn("divide-y", a.divider)}>
            {transactions.map((tx) => (
              <div key={tx.id} className={cn("p-4 md:p-6 flex items-center justify-between transition-colors", a.txHover)}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    tx.type === 'Payout'
                      ? (a.isDark ? 'bg-rose-900/20 text-rose-400' : 'bg-rose-50 text-rose-600')
                      : (a.isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                  )}>
                    {tx.type === 'Payout' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={cn("font-bold text-sm", a.head)}>{tx.desc}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[10px] font-bold tracking-wide", a.muted)}>{tx.date}</span>
                      <span className={cn("text-[10px]", a.muted)}>•</span>
                      <span className={cn("text-[10px] font-medium flex items-center gap-1", a.sub)}>
                        {tx.status === t('Ολοκληρώθηκε', 'Completed') || tx.status === t('Διαθέσιμο', 'Available')
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <Clock className="w-3 h-3 text-amber-500" />}
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", tx.type === 'Payout' ? a.head : 'text-emerald-500')}>
                    {tx.type === 'Payout' ? '-' : '+'}€{tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
