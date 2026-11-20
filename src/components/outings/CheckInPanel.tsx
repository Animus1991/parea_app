import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, Circle, DoorClosed, KeyRound, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { Button } from '../common/Button';
import { PersonAvatar } from '../wall/PersonAvatar';
import { cn } from '../../lib/utils';
import type { Group, User } from '../../types';

type Detector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

function barcodeDetector(): Detector | null {
  const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
  return Ctor ? new Ctor({ formats: ['qr_code'] }) : null;
}

/**
 * Host's door list (DICE / Luma / Meetup, adapted): scan a ticket QR (where
 * the browser can), type the 6-digit code, or tick someone by hand. Closing
 * check-in rewards arrivals and records absences — only if 2+ people were
 * confirmed. Night feedback waits until ~45 minutes after the outing ends.
 */
export function CheckInPanel({ group, members }: { group: Group; members: User[] }) {
  const { t } = useLanguage();
  const checkInMember = useStore((s) => s.checkInMember);
  const undoCheckIn = useStore((s) => s.undoCheckIn);
  const closeCheckIn = useStore((s) => s.closeCheckIn);
  const isCheckInOpen = useStore((s) => s.isCheckInOpen);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canScan = typeof window !== 'undefined' && 'BarcodeDetector' in window && Boolean(navigator.mediaDevices?.getUserMedia);

  const open = isCheckInOpen(group.id);
  const closed = Boolean(group.checkInClosedAt);
  const arrived = members.filter((m) => group.checkIns?.[m.id]).length;

  const say = (r: { ok: boolean; el: string; en: string }) => setMessage({ ok: r.ok, text: t(r.el, r.en) });

  // Camera scanning, only where BarcodeDetector exists; stops on unmount.
  useEffect(() => {
    if (!scanning) return;
    const detector = barcodeDetector();
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (stopped || !videoRef.current || !detector) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        timer = window.setInterval(async () => {
          if (!videoRef.current) return;
          const found = await detector.detect(videoRef.current).catch(() => []);
          if (found[0]?.rawValue) {
            say(checkInMember(group.id, { payload: found[0].rawValue }));
          }
        }, 500);
      } catch {
        setMessage({ ok: false, text: t('Δεν δόθηκε πρόσβαση στην κάμερα. Πληκτρολόγησε τον κωδικό.', 'No camera access. Type the code instead.') });
        setScanning(false);
      }
    })();
    return () => {
      stopped = true;
      window.clearInterval(timer);
      stream?.getTracks().forEach((tr) => tr.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when scanning toggles or the group changes
  }, [scanning, group.id]);

  return (
    <section className="rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="checkin-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="checkin-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <KeyRound className="h-4 w-4" aria-hidden /> {t('Check-in στην πόρτα', 'Door check-in')}
        </h3>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs font-bold text-ink" aria-live="polite">
          {arrived}/{members.length} {t('μέσα', 'in')}
        </span>
      </div>
      {open.el && <p className="mt-1 text-xs font-medium text-ink-muted">{t(open.el, open.en)}</p>}

      {!closed && open.open && (
        <>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              say(checkInMember(group.id, { code }));
              setCode('');
            }}
          >
            <label htmlFor="checkin-code" className="sr-only">
              {t('Κωδικός 6 ψηφίων από το εισιτήριο', '6-digit code from the ticket')}
            </label>
            <input
              id="checkin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
              placeholder={t('Κωδικός 6 ψηφίων', '6-digit code')}
              className="min-h-10 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 font-mono text-sm font-bold tracking-widest text-ink placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:text-ink-muted"
            />
            <Button type="submit" size="sm" disabled={code.replace(/\D/g, '').length !== 6}>
              {t('Έλεγχος', 'Check')}
            </Button>
          </form>
          {canScan && (
            <div className="mt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setScanning((v) => !v)}>
                {scanning ? <CameraOff className="mr-1.5 h-4 w-4" aria-hidden /> : <Camera className="mr-1.5 h-4 w-4" aria-hidden />}
                {scanning ? t('Σταμάτα τη σάρωση', 'Stop scanning') : t('Σάρωση QR', 'Scan QR')}
              </Button>
              {scanning && <video ref={videoRef} muted playsInline className="mt-2 w-full max-w-xs rounded-xl border border-border" />}
            </div>
          )}
        </>
      )}

      {message && (
        <p role="status" className={cn('mt-2 rounded-xl border px-3 py-2 text-xs font-bold', message.ok ? 'border-border text-ink' : 'border-red-300 text-red-700 dark:text-red-300')}>
          {message.text}
        </p>
      )}

      <ul className="mt-3 divide-y divide-border">
        {members.map((m) => {
          const rec = group.checkIns?.[m.id];
          return (
            <li key={m.id} className="flex items-center gap-3 py-2">
              <PersonAvatar user={m} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{m.name}</span>
                <span className="block text-2xs font-medium text-ink-muted">
                  {rec
                    ? `${t('Μέσα', 'In')} · ${new Date(rec.at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })} · ${rec.method === 'qr' ? 'QR' : rec.method === 'code' ? t('κωδικός', 'code') : t('χειροκίνητα', 'by hand')}`
                    : closed
                      ? t('Δεν ήρθε', 'Did not come')
                      : t('Αναμένεται', 'Expected')}
                </span>
              </span>
              {!closed && open.open && (rec ? (
                <button
                  type="button"
                  onClick={() => undoCheckIn(group.id, m.id)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-bold text-ink hover:border-border-strong"
                  aria-label={t(`Αναίρεση check-in για ${m.name}`, `Undo check-in for ${m.name}`)}
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden /> {t('Αναίρεση', 'Undo')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => say(checkInMember(group.id, { userId: m.id }))}
                  className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border px-2.5 text-xs font-bold text-ink hover:border-border-strong"
                  aria-label={t(`Check-in για ${m.name}`, `Check in ${m.name}`)}
                >
                  <Circle className="h-3.5 w-3.5" aria-hidden /> {t('Ήρθε', 'Arrived')}
                </button>
              ))}
              {rec && (closed || !open.open) && <CheckCircle2 className="h-4 w-4 text-ink" aria-label={t('Μέσα', 'In')} />}
            </li>
          );
        })}
      </ul>

      {!closed && open.open && (
        <div className="mt-3 border-t border-border pt-3">
          {confirmClose ? (
            <div className="space-y-2" role="alertdialog" aria-labelledby="close-checkin-q">
              <p id="close-checkin-q" className="text-xs font-medium text-ink">
                {arrived >= 2
                  ? t(
                      `Όσοι δεν έχουν check-in (${members.length - arrived}) θα καταγραφούν ως απόντες, με δυνατότητα ένστασης. Συνέχεια;`,
                      `Those without check-in (${members.length - arrived}) will be recorded as absent, and can appeal. Continue?`,
                    )
                  : t('Λιγότερα από 2 άτομα έχουν check-in, οπότε δεν θα καταγραφούν απουσίες. Συνέχεια;', 'Fewer than 2 people are checked in, so no absences will be recorded. Continue?')}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const result = closeCheckIn(group.id);
                    say(result);
                    setConfirmClose(false);
                    setScanning(false);
                    toast.success(t(result.el, result.en));
                  }}
                >
                  {t('Κλείσιμο check-in', 'Close check-in')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmClose(false)}>
                  {t('Άκυρο', 'Cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmClose(true)}>
              <DoorClosed className="mr-1.5 h-4 w-4" aria-hidden /> {t('Κλείσιμο check-in', 'Close check-in')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
