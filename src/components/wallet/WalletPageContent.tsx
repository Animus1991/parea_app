import React, { useState } from 'react';
import { CreditCard, Euro, ArrowUpRight, ArrowDownRight, Clock, Building2, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { isStripeConfigured, openStripeCheckout } from '../../services/payments';

export default function WalletPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const [txFilter, setTxFilter] = useState<'all' | 'month' | 'last'>('all');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);
  const stripeReady = isStripeConfigured();

  const transactions = [
    { id: '1', type: 'Payout', amount: 120.00, status: t('Ολοκληρώθηκε', 'Completed'), date: 'Oct 12, 2024', desc: t('Μεταφορά στην τράπεζα 4092', 'Transfer to Bank ****4092') },
    { id: '2', type: 'Earnings', amount: 45.00, status: t('Διαθέσιμο', 'Available'), date: 'Oct 10, 2024', desc: t('Πωλήσεις: Yoga στο Πάρκο', 'Ticket sales: Yoga in the Park') },
    { id: '3', type: 'Earnings', amount: 25.00, status: t('Σε Επεξεργασία', 'Processing'), date: 'Oct 14, 2024', desc: t('Πωλήσεις: Comedy Night', 'Ticket sales: Comedy Night') },
  ];

  const filteredTx = txFilter === 'all'
    ? transactions
    : transactions.filter((tx) => txFilter === 'month' ? tx.date.includes('Oct') : tx.date.includes('Sep'));

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 className={cn("text-base md:text-lg font-bold", a.head)}>{t('Πορτοφόλι & Έσοδα', 'Wallet & Earnings')}</h1>
        <p className={cn("font-medium text-sm mt-1", a.sub)}>{t('Διαχειριστείτε τα έσοδα και τις πληρωμές σας.', 'Manage your event revenue and payouts.')}</p>
        <p className={cn('text-xs font-bold mt-2', a.muted)}>
          {stripeReady
            ? t('Stripe ενεργό — οι αναλήψεις ανοίγουν Checkout.', 'Stripe enabled — withdrawals open Checkout.')
            : t('Λειτουργία demo — ορίστε VITE_STRIPE_* για πραγματικές πληρωμές.', 'Demo mode — set VITE_STRIPE_* for real payments.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("p-4 text-white shadow-soft-md", a.balanceBg)}>
          <div className={cn("flex items-center gap-2 mb-2", a.balanceLabel)}>
            <Euro className="w-4 h-4" />
            <h3 className="text-xs font-bold tracking-wide">{t('Διαθέσιμο Υπόλοιπο', 'Available Balance')}</h3>
          </div>
          <p className="text-lg font-black mb-4">€345.50</p>
          <Button className={cn("w-full", a.withdrawBtn)} onClick={() => setShowWithdraw(true)}>
            {t('Ανάληψη χρημάτων', 'Withdraw Funds')}
          </Button>
        </Card>

        <Card className="p-4">
          <div className={cn("flex items-center gap-2 mb-2", a.sub)}>
            <Clock className="w-4 h-4" />
            <h3 className="text-xs font-bold tracking-wide">{t('Εκκρεμεί', 'Pending')}</h3>
          </div>
          <p className={cn("text-lg font-bold mb-2", a.head)}>€85.00</p>
          <p className={cn("text-xs font-medium leading-tight", a.muted)}>
            {t('Εξοφλούνται 3-5 ημέρες μετά.', 'Clears 3-5 days after event.')}
          </p>
        </Card>

        <Card className={cn("p-4 flex flex-col justify-center border", a.bankBg)}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", a.bankIcon)}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn("font-bold text-sm", a.head)}>{t('Τραπεζικός λογαριασμός', 'Bank Account')}</h3>
              <p className={cn("text-xs font-medium", a.sub)}>Chase ****4092</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowPayouts(true)}>{t('Διαχείριση', 'Manage Payouts')}</Button>
        </Card>
      </div>

      <Card className="mt-2">
        <div className={cn("p-4 border-b flex items-center justify-between", a.borderB)}>
          <h2 className={cn("text-sm font-bold", a.head)}>{t('Πρόσφατες Συναλλαγές', 'Recent Transactions')}</h2>
          <select
            className={cn("text-xs border rounded-2xl px-2 py-1 outline-none", a.selectBg)}
            value={txFilter}
            onChange={(e) => setTxFilter(e.target.value as typeof txFilter)}
            aria-label={t('Φίλτρο συναλλαγών', 'Transaction filter')}
          >
            <option value="all">{t('Όλες', 'All Time')}</option>
            <option value="month">{t('Αυτόν τον Μήνα', 'This Month')}</option>
            <option value="last">{t('Προηγούμενο', 'Last Month')}</option>
          </select>
        </div>
        <div className={a.divider}>
          {filteredTx.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={CreditCard}
                title={t('Καμία συναλλαγή', 'No transactions')}
                description={t(
                  'Δεν υπάρχουν συναλλαγές για αυτό το φίλτρο.',
                  'No transactions match this filter.',
                )}
                actionLabel={t('Όλες', 'All Time')}
                onAction={() => setTxFilter('all')}
              />
            </div>
          ) : (
          <div className={cn("divide-y", a.divider)}>
            {filteredTx.map((tx) => (
              <div key={tx.id} className={cn("p-4 flex items-center justify-between transition-colors", a.txHover)}>
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
                      <span className={cn("text-xs font-bold tracking-wide", a.muted)}>{tx.date}</span>
                      <span className={cn("text-xs", a.muted)}>•</span>
                      <span className={cn("text-xs font-medium flex items-center gap-1", a.sub)}>
                        {tx.status === t('Ολοκληρώθηκε', 'Completed') || tx.status === t('Διαθέσιμο', 'Available')
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <Clock className="w-3 h-3 text-amber-500" />}
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold", tx.type === 'Payout' ? a.head : a.isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    {tx.type === 'Payout' ? '-' : '+'}€{tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </Card>

      <Modal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title={t('Ανάληψη χρημάτων', 'Withdraw Funds')}
        size="md"
      >
        <p className="text-sm mb-4 text-ink-muted">
          {stripeReady
            ? t('Θα ανοίξει Stripe Checkout για την ανάληψη.', 'Stripe Checkout will open for this withdrawal.')
            : t('Demo ροή — η ανάληψη καταγράφεται τοπικά.', 'Demo flow — withdrawal is logged locally only.')}
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setShowWithdraw(false)}>{t('Ακύρωση', 'Cancel')}</Button>
          <Button
            data-autofocus
            onClick={() => {
              setShowWithdraw(false);
              if (stripeReady && openStripeCheckout('/wallet')) {
                toast.success(t('Άνοιγμα Stripe Checkout…', 'Opening Stripe Checkout…'));
                return;
              }
              toast.success(t('Η ανάληψη υποβλήθηκε (demo)', 'Withdrawal submitted (demo)'));
            }}
          >
            {stripeReady ? t('Συνέχεια στο Stripe', 'Continue to Stripe') : t('Επιβεβαίωση', 'Confirm')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={showPayouts}
        onClose={() => setShowPayouts(false)}
        title={t('Διαχείριση πληρωμών', 'Manage Payouts')}
        size="md"
      >
        <p className="text-sm mb-4 text-ink-muted">
          {stripeReady
            ? t('Άνοιγμα Stripe για ενημέρωση τρόπου πληρωμής.', 'Open Stripe to update payout method.')
            : t('Demo — ενημέρωση τραπεζικού λογαριασμού σύντομα.', 'Demo — bank account update coming soon.')}
        </p>
        <Button
          className="w-full"
          data-autofocus
          onClick={() => {
            setShowPayouts(false);
            if (stripeReady && openStripeCheckout('/wallet')) {
              toast.success(t('Άνοιγμα Stripe…', 'Opening Stripe…'));
              return;
            }
            toast.info(t('Αποθηκεύτηκε (demo)', 'Saved (demo)'));
          }}
        >
          {stripeReady ? t('Άνοιγμα Stripe', 'Open Stripe') : t('Κλείσιμο', 'Close')}
        </Button>
      </Modal>
    </div>
  );
}
