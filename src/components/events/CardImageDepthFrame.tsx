import type { ReactNode } from 'react';
import { EventCoverImg } from '../common/EventCoverImg';
import { cn } from '../../lib/utils';
import {
  cardImageDepthFlags,
  type EventCardImageDepth,
} from '../../lib/discoverCardImagePreview';
import type { Event } from '../../types';

/**
 * Photo well that follows the same 7-depth overlay as Discover EventCard:
 * compact photo, then title / facts / organizer on the image, roomy space,
 * progress, or a full-bleed photo that also holds the CTA.
 */
export function CardImageDepthFrame({
  event,
  depth,
  alt,
  grayscale = false,
  photoHeightClass = 'h-48',
  top,
  overlay,
  children,
}: {
  event: Event;
  depth: EventCardImageDepth;
  alt?: string;
  grayscale?: boolean;
  photoHeightClass?: string;
  top?: ReactNode;
  overlay?: ReactNode;
  children?: ReactNode;
}) {
  const flags = cardImageDepthFlags(depth);
  return (
    <>
      <div
        className={cn(
          'relative w-full overflow-hidden bg-gray-100',
          grayscale && 'grayscale',
          !flags.coverTitle && cn(photoHeightClass, 'shrink-0'),
          flags.photoFillsCard && 'flex min-h-0 flex-1 flex-col',
          flags.coverFull && 'h-full',
          !flags.coverFull && 'rounded-b-[7.2px] md:rounded-b-[6.4px]',
        )}
        data-image-depth={depth}
      >
        <EventCoverImg
          event={event}
          alt={alt ?? event.title}
          className={cn(
            'object-cover object-center',
            flags.coverTitle ? 'absolute inset-0 h-full w-full' : 'h-full w-full',
          )}
        />
        <div
          className={cn(
            'pointer-events-none absolute inset-0',
            flags.coverFull
              ? 'bg-gradient-to-t from-black/80 via-black/40 to-black/10'
              : flags.coverTitle
                ? 'bg-gradient-to-t from-black/75 via-black/30 to-transparent'
                : 'bg-gradient-to-t from-black/50 via-black/0',
          )}
        />
        {top ? (
          <div className={cn(flags.coverTitle ? 'relative z-10 h-48' : 'contents')}>{top}</div>
        ) : null}
        {flags.coverTitle && overlay ? (
          <div
            className={cn(
              'relative z-10 flex flex-col gap-3.5 px-4 pt-1 pb-4',
              flags.photoFillsCard && 'flex-1',
            )}
          >
            {overlay}
          </div>
        ) : null}
      </div>
      {!flags.coverFull ? children : null}
    </>
  );
}

export { cardImageDepthFlags };
