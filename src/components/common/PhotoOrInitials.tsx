import { useState } from 'react';

/**
 * A person's photo, or their initials when there is none or it fails to load
 * (offline, blocked host, expired link). Never a broken-image icon with the
 * name printed over it. The image is decorative: the name sits beside it.
 */
export function PhotoOrInitials({
  src,
  name,
  imgClassName = 'w-full h-full object-cover',
}: {
  src?: string | null;
  name: string;
  imgClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{name.substring(0, 2)}</>;
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      className={imgClassName}
    />
  );
}
