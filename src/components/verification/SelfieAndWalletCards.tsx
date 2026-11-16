import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Camera, Landmark, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { Button } from '../common/Button';

const PROMPTS = [
  { el: 'Κοίτα την κάμερα', en: 'Look at the camera' },
  { el: 'Γύρνα λίγο το κεφάλι αριστερά', en: 'Turn your head slightly left' },
  { el: 'Χαμογέλα', en: 'Smile' },
];

/**
 * Selfie check (Bumble BFF, adapted): a short live check that you are the
 * person in your photos. Nothing is uploaded or kept — only the result, the
 * method and the date. In production a verification provider does the
 * face match; the stored record stays the same.
 */
export function SelfieCheckCard() {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const complete = useStore((s) => s.completeSelfieCheck);
  const [phase, setPhase] = useState<'idle' | 'camera' | 'nocamera'>('idle');
  const [step, setStep] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };
  useEffect(() => stop, []);

  const start = async () => {
    setStep(0);
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('nocamera');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setPhase('camera');
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
      }, 0);
    } catch {
      setPhase('nocamera');
    }
  };

  const finish = () => {
    stop();
    complete();
    setPhase('idle');
    toast.success(t('Το selfie επαληθεύτηκε — η φωτογραφία δεν αποθηκεύτηκε.', 'Selfie verified — the photo was not stored.'));
  };

  if (!me) return null;
  const done = Boolean(me.selfieVerified);

  return (
    <section id="verify-selfie" className="rounded-2xl border border-border bg-surface-raised p-5" aria-labelledby="selfie-title">
      <div className="flex items-start justify-between gap-2">
        <h3 id="selfie-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <Camera className="h-5 w-5" aria-hidden /> {t('Selfie επαλήθευση', 'Selfie check')}
        </h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-2xs font-bold text-ink">
          {done ? t('Ολοκληρώθηκε', 'Completed') : t('Προαιρετικό', 'Optional')}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-ink-muted">
        {t('Δείχνει στις ομάδες ότι είσαι το άτομο των φωτογραφιών σου. Παίρνεις το σήμα «Selfie».', 'Shows groups you are the person in your photos. You get the “Selfie” badge.')}
      </p>
      {done ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-bold text-ink">
          <BadgeCheck className="h-4 w-4" aria-hidden />
          {t(`Επαληθεύτηκε στις ${me.verifiedVia?.selfie ?? ''}`, `Verified on ${me.verifiedVia?.selfie ?? ''}`)}
        </p>
      ) : phase === 'camera' ? (
        <div className="mt-3 space-y-2">
          <video ref={videoRef} muted playsInline className="w-full max-w-xs -scale-x-100 rounded-xl border border-border" />
          <p className="text-sm font-bold text-ink" role="status">
            {t(PROMPTS[step].el, PROMPTS[step].en)} ({step + 1}/{PROMPTS.length})
          </p>
          <div className="flex gap-2">
            {step < PROMPTS.length - 1 ? (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                {t('Έγινε', 'Done')}
              </Button>
            ) : (
              <Button size="sm" onClick={finish}>
                {t('Ολοκλήρωση', 'Finish')}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                stop();
                setPhase('idle');
              }}
            >
              {t('Άκυρο', 'Cancel')}
            </Button>
          </div>
        </div>
      ) : phase === 'nocamera' ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-ink">
            {t('Δεν υπάρχει πρόσβαση στην κάμερα σε αυτή τη συσκευή. Στο demo μπορείς να ολοκληρώσεις τον έλεγχο χωρίς κάμερα.', 'No camera access on this device. In the demo you can finish the check without a camera.')}
          </p>
          <Button size="sm" onClick={finish}>
            {t('Ολοκλήρωση (demo)', 'Finish (demo)')}
          </Button>
        </div>
      ) : (
        <Button size="sm" className="mt-3" onClick={start}>
          {t('Ξεκίνα (30″)', 'Start (30s)')}
        </Button>
      )}
      <p className="mt-3 flex items-start gap-1.5 text-2xs font-medium text-ink-muted">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t('Δεν ανεβαίνει και δεν κρατιέται καμία εικόνα. Κρατάμε μόνο: αποτέλεσμα, μέθοδο, ημερομηνία.', 'No image is uploaded or kept. We keep only: result, method, date.')}
      </p>
    </section>
  );
}

/**
 * Gov.gr Wallet (under study): honest status, an opt-in to hear when it is
 * ready, and the promise of what would be stored. No ID data, ever.
 */
export function GovWalletCard() {
  const { t } = useLanguage();
  const interested = useStore((s) => s.govWalletInterest);
  const setInterest = useStore((s) => s.setGovWalletInterest);
  return (
    <section id="verify-govgr" className="rounded-2xl border border-dashed border-border bg-surface-raised p-5" aria-labelledby="govgr-title">
      <div className="flex items-start justify-between gap-2">
        <h3 id="govgr-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <Landmark className="h-5 w-5" aria-hidden /> Gov.gr Wallet
        </h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-2xs font-bold text-ink">{t('Υπό διερεύνηση', 'Under study')}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-ink-muted">
        {t(
          'Εξετάζουμε επαλήθευση ηλικίας και ταυτότητας μέσω Gov.gr Wallet, χωρίς να βλέπουμε τα στοιχεία σου. Δεν είναι ακόμη διαθέσιμη.',
          'We are looking into age and identity checks through Gov.gr Wallet, without seeing your details. It is not available yet.',
        )}
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-2xs font-medium text-ink-muted">
        <li>{t('Θα κρατάμε μόνο: αποτέλεσμα (ναι/όχι), μέθοδο, ημερομηνία.', 'We would keep only: result (yes/no), method, date.')}</li>
        <li>{t('Ποτέ αριθμό ταυτότητας, ΑΦΜ, διεύθυνση ή φωτογραφία εγγράφου.', 'Never an ID number, tax number, address or document photo.')}</li>
      </ul>
      <Button size="sm" variant={interested ? 'outline' : 'primary'} className="mt-3" aria-pressed={interested} onClick={() => setInterest(!interested)}>
        {interested ? t('Θα σε ενημερώσουμε ✓', 'We will let you know ✓') : t('Ενημέρωσέ με', 'Let me know')}
      </Button>
    </section>
  );
}
