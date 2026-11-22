import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { WALLET_TYPO } from '../../lib/typographyTokens';
import { formatWalletEur, WALLET_DEMO } from '../../lib/walletDemo';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { AppSelect } from '../common/AppSelect';
import { formatEur } from '../../lib/money';
import { formatPlanWhenDay } from '../../lib/dateLocale';

export default function WalletPageContent() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const a = usePageContrast();
  const [txFilter, setTxFilter] = useState<'all' | 'month' | 'last'>('all');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayouts, setShowPayouts] = useState(false);
  const stripeReady = isStripeConfigured();

  usePublishPageSnapshot({
    titleEl: 'Πορτοφόλι & έσοδα',
    titleEn: 'Wallet & Earnings',
    state: txFilter,
    summaryEl: `Διαθέσιμο ${formatWalletEur(WALLET_DEMO.availableEur, 'el')} · εκκρεμές ${formatWalletEur(WALLET_DEMO.pendingEur, 'el')}`,
    summaryEn: `Available ${formatWalletEur(WALLET_DEMO.availableEur, 'en')} · pending ${formatWalletEur(WALLET_DEMO.pendingEur, 'en')}`,
  });

  const transactions = [
    { id: '1', type: 'Payout', amount: 120.00, status: t('Ολοκληρώθηκε', 'Completed'), date: formatPlanWhenDay('2024-10-12', language), monthKey: 'Oct', desc: t('Μεταφορά στην τράπεζα 4092 (demo)', 'Transfer to Bank ****4092 (demo)') },
    { id: '2', type: 'Earnings', amount: 45.00, status: t('Διαθέσιμο', 'Available'), date: formatPlanWhenDay('2024-10-10', language), monthKey: 'Oct', desc: t('Πωλήσεις: Yoga στο Πάρκο', 'Ticket sales: Yoga in the Park') },
    { id: '3', type: 'Earnings', amount: 25.00, status: t('Σε επεξεργασία', 'Processing'), date: formatPlanWhenDay('2024-10-14', language), monthKey: 'Oct', desc: t('Πωλήσεις: Comedy Night', 'Ticket sales: Comedy Night') },
  ];

  const filteredTx = txFilter === 'all'
    ? transactions
    : transactions.filter((tx) => txFilter === 'month' ? tx.monthKey === 'Oct' : tx.monthKey === 'Sep');

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div>
        <h1 className={cn(WALLET_TYPO.pageTitle, a.head)}>{t('Πορτοφόλι & έσοδα', 'Wallet & Earnings')}</h1>
        <p className={cn(WALLET_TYPO.statusNote, 'mt-1', a.muted)}>
          {t(
            `${formatWalletEur(WALLET_DEMO.availableEur, 'el')} διαθέσιμα · ${transactions.length} κινήσεις`,
            `${formatWalletEur(WALLET_DEMO.availableEur, 'en')} available · ${transactions.length} transactions`,
          )}
        </p>
        {stripeReady && (
          <p className={cn(WALLET_TYPO.statusNote, 'mt-2', a.muted)}>
            {t('Οι αναλήψεις γίνονται μέσω Stripe.', 'Withdrawals go through Stripe.')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn("p-4 text-white shadow-soft-md", a.balanceBg)}>
          <div className={cn("flex items-center gap-2 mb-2", a.balanceLabel)}>
            <Euro className="w-4 h-4" />
            <h3 className={WALLET_TYPO.kpiLabel}>{t('Διαθέσιμο υπόλοιπο', 'Available Balance')}</h3>
          </div>
          <p className={cn(WALLET_TYPO.kpiValue, 'mb-4')}>{formatWalletEur(WALLET_DEMO.availableEur, language)}</p>
          <Button className={cn("w-full", a.withdrawBtn)} onClick={() => setShowWithdraw(true)}>
            {t('Ανάληψη χρημάτων', 'Withdraw Funds')}
          </Button>
        </Card>

        <Card className="p-4">
          <div className={cn("flex items-center gap-2 mb-2", a.sub)}>
            <Clock className="w-4 h-4" />
            <h3 className={WALLET_TYPO.kpiLabel}>{t('Εκκρεμεί', 'Pending')}</h3>
          </div>
          <p className={cn(WALLET_TYPO.kpiValueSecondary, 'mb-2', a.head)}>{formatWalletEur(WALLET_DEMO.pendingEur, language)}</p>
          <p className={cn(WALLET_TYPO.kpiHint, a.muted)}>
            {t('Εξοφλούνται 3-5 ημέρες μετά.', 'Clears 3-5 days after event.')}
          </p>
        </Card>

        <Card className={cn("p-4 flex flex-col justify-center border", a.bankBg)}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border", a.bankIcon)}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn(WALLET_TYPO.rowTitle, a.head)}>{t('Τραπεζικός λογαριασμός', 'Bank Account')}</h3>
              <p className={cn(WALLET_TYPO.rowMeta, a.sub)}>{t(WALLET_DEMO.bankLabelEl, WALLET_DEMO.bankLabelEn)}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowPayouts(true)}>{t('Διαχείριση', 'Manage Payouts')}</Button>
        </Card>
      </div>

      <Card className="mt-2">
        <div className={cn("p-4 md:p-4 border-b flex items-center justify-between", a.borderB)}>
          <h2 className={cn(WALLET_TYPO.sectionInCard, a.head)}>{t('Πρόσφατες συναλλαγές', 'Recent Transactions')}</h2>
          <AppSelect
            className={cn("filter-select border outline-none", a.selectBg)}
            value={txFilter}
            onValueChange={(v) => setTxFilter(v as typeof txFilter)}
            ariaLabel={t('Φίλτρο συναλλαγών', 'Transaction filter')}
            options={[
              { value: 'all', label: t('Όλες', 'All Time') },
              { value: 'month', label: t('Αυτόν τον Μήνα', 'This Month') },
              { value: 'last', label: t('Προηγούμενο', 'Last Month') },
            ]}
          />
        </div>
        <div className={a.divider}>
          {filteredTx.length === 0 ? (
            <div className="p-4">
              <EmptyState
                character="host"
                icon={CreditCard}
                title={t('Καμία συναλλαγή', 'No transactions')}
                actionLabel={txFilter === 'all' ? t('Εξερεύνηση', 'Explore') : t('Όλες', 'All Time')}
                onAction={txFilter === 'all' ? () => navigate('/') : () => setTxFilter('all')}
                secondaryLabel={t('Βρες Nakamas', 'Find Nakamas')}
                onSecondary={() => navigate('/buddy-seek')}
                askAi
                askPrompt={t(
                  'Σύνοψη πορτοφολιού — demo στοιχεία μόνο',
                  'Summarise my wallet — demo figures only',
                )}
              />
            </div>
          ) : (
          <div className={cn("divide-y", a.divider)}>
            {filteredTx.map((tx) => (
              <div key={tx.id} className={cn("p-4 md:p-4 flex items-center justify-between transition-colors", a.txHover)}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    tx.type === 'Payout'
                      ? (a.isDark ? 'bg-rose-900/20 text-rose-400' : 'bg-rose-50 text-rose-600')
                      : (a.isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                  )}>
                    {tx.type === 'Payout' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className={cn(WALLET_TYPO.rowTitle, a.head)}>{tx.desc}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(WALLET_TYPO.rowDate, a.muted)}>{tx.date}</span>
                      <span className={cn("text-xs", a.muted)}>•</span>
                      <span className={cn(WALLET_TYPO.rowMeta, 'flex items-center gap-1', a.sub)}>
                        {tx.status === t('Ολοκληρώθηκε', 'Completed') || tx.status === t('Διαθέσιμο', 'Available')
                          ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          : <Clock className="w-3 h-3 text-amber-500" />}
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(WALLET_TYPO.rowTitle, tx.type === 'Payout' ? a.head : a.isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                    {tx.type === 'Payout' ? '−' : '+'}{formatEur(tx.amount, language, true)}
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
        <p className={cn(WALLET_TYPO.modalBody, 'mb-4 text-ink-muted')}>
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
        <p className={cn(WALLET_TYPO.modalBody, 'mb-4 text-ink-muted')}>
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
