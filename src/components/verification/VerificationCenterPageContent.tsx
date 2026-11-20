import React, { useEffect, useRef } from 'react';
import { ShieldCheck, UserCheck, Smartphone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useStore } from '../../store';
import { toast } from 'sonner';
import { APP_TYPO } from '../../lib/typographyTokens';
import { verifyDemo } from '../../lib/verifyDemo';
import { GovWalletCard, SelfieCheckCard } from './SelfieAndWalletCards';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerificationCenterPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const currentUser = useStore((s) => s.currentUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlight = searchParams.get('method');

  useEffect(() => {
    if (!highlight) return;
    const id =
      highlight === 'email'
        ? 'verify-email'
        : highlight === 'phone'
          ? 'verify-phone'
          : highlight === 'id'
            ? 'verify-id'
            : null;
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlight]);

  if (!currentUser) return null;

  const steps = [
    currentUser.emailVerified,
    currentUser.phoneVerified,
  ];
  const completedSteps = steps.filter(Boolean).length;
  const progressPct = Math.round((completedSteps / 2) * 100);

  const handleVerifyPhone = () => {
    if (verifyDemo('phone')) toast.success(t('Το τηλέφωνο επαληθεύτηκε (demo)', 'Phone verified (demo)'));
  };

  const handleVerifyEmail = () => {
    if (verifyDemo('email')) toast.success(t('Το email επαληθεύτηκε (demo)', 'Email verified (demo)'));
  };

  const handleUploadId = () => {
    fileRef.current?.click();
  };

  const onIdSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    if (verifyDemo('id')) {
      toast.success(t('Η ταυτότητα υποβλήθηκε και επαληθεύτηκε (demo)', 'ID uploaded and verified (demo)'));
    }
    e.target.value = '';
  };

  const ringFor = (method: string) =>
    highlight === method ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : '';

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn(APP_TYPO.pageTitle, a.head)}>{t('Επαλήθευση', 'Verification')}</h1>
          <p className={cn(APP_TYPO.pageSub, 'mt-1', a.sub)}>
            {t(
              'Email και τηλέφωνο αρκούν για τις περισσότερες εξόδους. Η ταυτότητα ζητείται μόνο για διοργάνωση και πληρωμές.',
              'Email and phone are enough for most outings. ID is only asked for hosting and payments.',
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => navigate('/trust')}>
          {t('Αξιοπιστία', 'Reliability')}
        </Button>
      </div>

      <div className={cn('rounded-xl p-4 flex gap-4 border', a.progressBg)}>
        <div className={cn('w-12 h-[42px] rounded-full flex items-center justify-center shrink-0', a.progressIcon)}>
          <ShieldCheck className={cn('w-6 h-6', a.progressIconColor)} />
        </div>
        <div className="flex-1">
          <h2 className={cn('font-bold text-sm', a.progressHead)}>{t('Πρόοδος Επαλήθευσης', 'Verification Progress')}</h2>
          <p className={cn('text-xs mt-1 mb-3', a.progressSub)}>
            {t(`${completedSteps} από 2 βασικά βήματα`, `${completedSteps} of 2 core steps completed`)}
          </p>
          <div className={cn('w-full rounded-full h-2', a.progressBar)}>
            <div className={cn('h-2 rounded-full transition-all', a.progressFill)} style={{ width: `${progressPct}%` }} />
          </div>
          <p className={cn('text-xs mt-2 font-medium', a.muted)}>
            {t('Βαθμός Αξιοπιστίας', 'Reliability Score')}: {currentUser.reliabilityScore}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card id="verify-email" className={cn('p-5', ringFor('email'))}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', a.completedIcon)}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn('font-bold text-sm', a.head)}>{t('Email Επαλήθευση', 'Email Verification')}</h3>
                <p className={cn('text-xs font-bold tracking-wider mt-0.5', currentUser.emailVerified ? (a.isDark ? 'text-emerald-400' : 'text-emerald-600') : a.pendingLabel)}>
                  {currentUser.emailVerified ? t('Ολοκληρώθηκε', 'Completed') : t('Σε εκκρεμότητα', 'Pending')}
                </p>
              </div>
            </div>
            {currentUser.emailVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
          {!currentUser.emailVerified && (
            <>
              <p className={cn('card-copy mt-4 mb-3', a.sub)}>
                {t('Θα σου στείλουμε σύνδεσμο επιβεβαίωσης στο email σου.', "We'll send a confirmation link to your email.")}
              </p>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleVerifyEmail}>
                {t('Επαλήθευση Τώρα', 'Verify Now')}
              </Button>
            </>
          )}
        </Card>

        <Card id="verify-phone" className={cn('p-5', ringFor('phone'))}>
          <div className={cn('flex items-start justify-between border-b pb-4 mb-4', a.borderB)}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', a.pendingIcon)}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn('font-bold text-sm', a.head)}>{t('Τηλέφωνο', 'Phone Number')}</h3>
                <p className={cn('text-xs font-bold tracking-wider mt-0.5', currentUser.phoneVerified ? (a.isDark ? 'text-emerald-400' : 'text-emerald-600') : a.pendingLabel)}>
                  {currentUser.phoneVerified ? t('Ολοκληρώθηκε', 'Completed') : t('Σε εκκρεμότητα', 'Pending')}
                </p>
              </div>
            </div>
            {currentUser.phoneVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
          {!currentUser.phoneVerified && (
            <>
              <p className={cn('card-copy mb-3', a.sub)}>{t('Θα σου στείλουμε SMS με κωδικό.', "We'll send you an SMS code.")}</p>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleVerifyPhone}>
                {t('Επαλήθευση Τώρα', 'Verify Now')}
              </Button>
            </>
          )}
        </Card>

        {/* Φ27 — selfie first, Gov.gr next, document photo last. */}
        <SelfieCheckCard />
        <GovWalletCard />

        <Card id="verify-id" className={cn('p-5 md:col-span-2', ringFor('id'))}>
          <div className={cn('flex items-start justify-between border-b pb-4 mb-4', a.borderB)}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', a.pendingIcon)}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn('font-bold text-sm', a.head)}>{t('Ταυτότητα — μόνο για διοργάνωση', 'ID — hosting only')}</h3>
                <p className={cn('text-xs font-bold tracking-wider mt-0.5', currentUser.idVerified ? (a.isDark ? 'text-emerald-400' : 'text-emerald-600') : a.pendingLabel)}>
                  {currentUser.idVerified ? t('Ολοκληρώθηκε', 'Completed') : t('Προαιρετικό', 'Optional')}
                </p>
              </div>
            </div>
            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full tracking-wide', a.advBadge)}>{t('Αν χρειαστεί', 'If needed')}</span>
          </div>
          <p className={cn('card-copy mb-4 max-w-xl', a.sub)}>
            {t(
              'Δεν τη ζητάμε για να φυλλομετρήσεις ή να μπεις στην πρώτη σου ομάδα. Προτιμάμε Gov.gr Wallet όταν είναι έτοιμο· στο demo μπορείς να ολοκληρώσεις χωρίς να κρατήσουμε φωτογραφία εγγράφου.',
              'We do not ask for this to browse or join your first group. We prefer Gov.gr Wallet when it is ready; in the demo you can finish without us keeping a document photo.',
            )}
          </p>
          <div className={cn('p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-dashed', a.uploadArea)}>
            <div className={cn('flex gap-3 card-copy font-medium', a.uploadText)}>
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" />{t('Χωρίς αποθήκευση εγγράφου', 'No document stored')}</span>
              <span className="flex items-center gap-1"><UserCheck className="w-4 h-4" />{t('Μόνο αποτέλεσμα', 'Result only')}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onIdSelected} />
            {!currentUser.idVerified ? (
              <Button size="sm" className="w-full sm:w-auto shrink-0 shadow-soft" onClick={handleUploadId}>
                {t('Ολοκλήρωση (demo)', 'Finish (demo)')}
              </Button>
            ) : (
              <span className={cn('text-xs font-bold', a.isDark ? 'text-emerald-400' : 'text-emerald-600')}>{t('Επαληθευμένο ✓', 'Verified ✓')}</span>
            )}
          </div>
        </Card>

      </div>

      <Card className="p-5">
        <h3 className={cn('text-xs font-bold tracking-wide mb-4', a.head)}>{t('Τι ξεκλειδώνεις', 'What you unlock')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Mail, label: t('Email', 'Email'), done: currentUser.emailVerified, color: 'text-cyan-600', bg: a.tierEmail },
            { icon: Smartphone, label: t('Τηλέφωνο', 'Phone'), done: currentUser.phoneVerified, color: 'text-emerald-600', bg: a.tierPhone },
            { icon: FileText, label: t('Διοργάνωση', 'Hosting'), done: currentUser.idVerified, color: 'text-purple-600', bg: a.tierId },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={cn('p-3 rounded-xl border flex items-center gap-3', item.bg)}>
                <Icon className={cn('w-5 h-5', item.color)} />
                <div>
                  <p className={cn('card-heading font-bold', a.head)}>{item.label}</p>
                  <p className={cn('text-xs font-bold', item.done ? 'text-emerald-600' : a.muted)}>
                    {item.done ? t('Ξεκλείδωτο', 'Unlocked') : t('Κλειδωμένο', 'Locked')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
