import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Link2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export function ChatCallModal({
  open,
  mode,
  title,
  participants,
  onClose,
  onEnded,
}: {
  open: boolean;
  mode: 'video' | 'audio';
  title: string;
  participants: { id: string; name: string }[];
  onClose: () => void;
  onEnded?: (durationSec: number, mode: 'video' | 'audio') => void;
}) {
  const { t } = useLanguage();
  const [micMuted, setMicMuted] = useState(false);
  const [camOn, setCamOn] = useState(mode === 'video');
  const [elapsed, setElapsed] = useState(0);
  const [hasLiveVideo, setHasLiveVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    setElapsed(0);
    setCamOn(mode === 'video');
    setMicMuted(false);
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const startMedia = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === 'video',
        });
        if (!active) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current && mode === 'video') {
          videoRef.current.srcObject = stream;
          setHasLiveVideo(stream.getVideoTracks().length > 0);
        }
      } catch {
        setHasLiveVideo(false);
      }
    };
    void startMedia();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      setHasLiveVideo(false);
    };
  }, [open, mode]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((tr) => {
      tr.enabled = !micMuted;
    });
    stream.getVideoTracks().forEach((tr) => {
      tr.enabled = camOn;
    });
  }, [micMuted, camOn]);

  if (!open) return null;

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  const handleEnd = () => {
    onEnded?.(elapsed, mode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-fullscreen bg-gray-950/90 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'video' ? t('Βιντεοκλήση', 'Video call') : t('Φωνητική κλήση', 'Voice call')}
    >
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-900 text-white shadow-soft-lg overflow-hidden flex flex-col">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold">{title}</p>
            <p className="text-2xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {mode === 'video' ? t('Βιντεοκλήση', 'Video call') : t('Ηχητική κλήση', 'Voice call')} · {mins}:{secs}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href).catch(() => {});
              toast.success(t('Ο σύνδεσμος κλήσης αντιγράφηκε', 'Call link copied'));
            }}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-2xs font-bold flex items-center gap-1"
          >
            <Link2 className="w-3 h-3" aria-hidden />
            {t('Πρόσκληση', 'Invite')}
          </button>
        </header>

        {/* Stage */}
        <div className="p-4 flex-1 min-h-[260px] flex flex-col justify-between gap-3 bg-gradient-to-b from-gray-900 to-gray-950 relative">
          <div className="grid grid-cols-2 gap-2.5 flex-1">
            {(participants.length > 0 ? participants.slice(0, 3) : [{ id: 'peer', name: title }]).map((p) => (
              <div
                key={p.id}
                className="rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center p-3 gap-2 relative"
              >
                <span className="w-12 h-12 rounded-full bg-cyan-600/30 border border-cyan-400/40 flex items-center justify-center text-sm font-extrabold text-cyan-200">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-semibold truncate max-w-full">{p.name.split(' ')[0]}</span>
                <span className="text-2xs text-white/50 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-400" aria-hidden />
                  {t('Συνδεδεμένος', 'Connected')}
                </span>
              </div>
            ))}

            {/* Local preview tile */}
            <div className="rounded-2xl bg-white/5 border border-cyan-500/30 flex flex-col items-center justify-center overflow-hidden relative min-h-[110px]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={cn('w-full h-full object-cover', (!hasLiveVideo || !camOn) && 'hidden')}
              />
              {(!hasLiveVideo || !camOn) && (
                <div className="flex flex-col items-center justify-center p-3 gap-1.5">
                  <span className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-extrabold">
                    {t('Εσύ', 'You')}
                  </span>
                  <span className="text-2xs text-white/60">
                    {camOn ? t('Προεπισκόπηση κάμερας', 'Camera preview') : t('Κάμερα κλειστή', 'Camera off')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <footer className="px-4 py-3.5 border-t border-white/10 flex items-center justify-center gap-3 bg-gray-900">
          <button
            type="button"
            onClick={() => setMicMuted((m) => !m)}
            aria-label={micMuted ? t('Άνοιγμα μικροφώνου', 'Unmute mic') : t('Σίγαση μικροφώνου', 'Mute mic')}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              micMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white',
            )}
          >
            {micMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setCamOn((c) => !c)}
            aria-label={camOn ? t('Κλείσιμο κάμερας', 'Turn camera off') : t('Άνοιγμα κάμερας', 'Turn camera on')}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              !camOn ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/10 hover:bg-white/20 text-white',
            )}
          >
            {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleEnd}
            aria-label={t('Τερματισμός κλήσης', 'End call')}
            className="px-5 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-soft"
          >
            <PhoneOff className="w-4 h-4" aria-hidden />
            {t('Τέλος', 'End')}
          </button>
        </footer>
      </div>
    </div>
  );
}
