import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

const CATEGORY_GRADIENT: Record<string, string> = {
  Sports: 'from-emerald-700 via-teal-800 to-cyan-900',
  Cinema: 'from-indigo-800 via-purple-900 to-slate-900',
  Exhibitions: 'from-amber-800 via-orange-900 to-stone-900',
  Workshops: 'from-rose-800 via-red-900 to-stone-900',
  default: 'from-cyan-800 via-slate-800 to-[#0f1419]',
};

function gradientFor(category: string): string {
  const key = Object.keys(CATEGORY_GRADIENT).find((k) =>
    category.toLowerCase().includes(k.toLowerCase()),
  );
  return CATEGORY_GRADIENT[key ?? 'default'];
}

export interface EventCoverImageProps {
  src?: string;
  alt: string;
  category: string;
  className?: string;
  imgClassName?: string;
}

/** Cover image with category gradient fallback when URL fails or is missing. */
export function EventCoverImage({
  src,
  alt,
  category,
  className,
  imgClassName,
}: EventCoverImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className={cn('relative overflow-hidden bg-[#0f1419]', className)}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          className={cn('w-full h-full object-cover', imgClassName)}
          referrerPolicy="no-referrer"
          loading="eager"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className={cn(
            'w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br',
            gradientFor(category),
          )}
          aria-hidden
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
            <Calendar className="w-7 h-7 text-white/80" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70 px-4 text-center">
            {category}
          </span>
        </div>
      )}
    </div>
  );
}
