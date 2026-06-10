import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

export function OfflineBanner() {
  const { t } = useLanguage();
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onOnline = () => {
      setOnline(true);
      setShowRestored(true);
      timer = setTimeout(() => setShowRestored(false), 3000);
    };
    const onOffline = () => {
      setOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (online && !showRestored) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm ${
        online ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white'
      }`}
    >
      {online ? (
        <>
          <Wifi className="w-3.5 h-3.5" aria-hidden />
          {t('Επανήλθε η σύνδεση', 'Back online')}
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" aria-hidden />
          {t('Είστε offline — οι αλλαγές μπορεί να μην αποθηκευτούν', 'You are offline — changes may not be saved')}
        </>
      )}
    </div>
  );
}
