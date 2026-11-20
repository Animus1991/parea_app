import { useEffect, useState } from 'react';
import { DEFAULT_EVENT_COVER, eventCoverUrl } from '../../lib/eventCover';
import type { Event } from '../../types';

export function EventCoverImg({
  event,
  alt = '',
  className,
}: {
  event: Pick<Event, 'id' | 'imageUrl' | 'kind' | 'tags'>;
  alt?: string;
  className?: string;
}) {
  // The cover depends on id, image, kind and tags; reset when any of them changes.
  const url = eventCoverUrl(event);
  const [src, setSrc] = useState(url);
  useEffect(() => {
    setSrc(url);
  }, [url]);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (src !== DEFAULT_EVENT_COVER) setSrc(DEFAULT_EVENT_COVER);
      }}
    />
  );
}
