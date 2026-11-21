import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Ticket } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { checkInPayload, currentCheckInCode, CHECKIN_WINDOW_MS } from '../../lib/checkIn';
import type { CheckInRecord } from '../../types/outings';

/**
 * A member's door ticket: a QR and the same 6-digit code, both changing
 * every 30 seconds so a screenshot forwarded to someone else stops working.
 */
export function CheckInTicket({
  groupId,
  userId,
  record,
  hostName,
}: {
  groupId: string;
  userId: string;
  record?: CheckInRecord;
  hostName?: string;
}) {
  const { t } = useLanguage();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (record) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [record]);

  if (record) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised p-4" role="status">
        <CheckCircle2 className="h-8 w-8 shrink-0 text-ink" aria-hidden />
        <div>
          <p className="text-sm font-bold text-ink">{t('Είσαι μέσα!', 'You are in!')}</p>
          <p className="text-xs font-medium text-ink-muted">
            {t('Το check-in έγινε στις ', 'Checked in at ')}
            {new Date(record.at).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}.
          </p>
        </div>
      </div>
    );
  }

  const { code, secondsLeft } = currentCheckInCode(groupId, userId, now);
  const progress = (secondsLeft * 1000) / CHECKIN_WINDOW_MS;
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-4 text-center">
      <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-ink">
        <Ticket className="h-4 w-4" aria-hidden /> {t('Το εισιτήριό σου για την πόρτα', 'Your door ticket')}
      </p>
      <div className="mx-auto mt-3 w-fit rounded-xl bg-white p-3">
        <QRCodeSVG value={checkInPayload(groupId, userId, code)} size={168} level="M" role="img" aria-label={t('QR εισόδου', 'Entry QR')} />
      </div>
      <p className="mt-3 font-mono text-2xl font-black tracking-widest text-ink" data-testid="checkin-code">
        <span className="sr-only">{t('Κωδικός: ', 'Code: ')}</span>
        {code.slice(0, 3)} {code.slice(3)}
      </p>
      <div className="mx-auto mt-2 h-1 w-40 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className="h-full bg-accent transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-1 text-xs font-medium text-ink-muted">
        {t(`Αλλάζει σε ${secondsLeft}″ · δείξ’ το ${hostName ? `στον/στην ${hostName}` : 'στον/στην οικοδεσπότη'}`, `Changes in ${secondsLeft}s · show it to ${hostName ?? 'the host'}`)}
      </p>
    </div>
  );
}
