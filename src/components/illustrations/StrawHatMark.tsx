/**
 * Nakamas straw hat, two camera angles on purpose:
 * - threeQuarter: the wordmark glyph (same drawing as the header logo).
 * - plan: κάτοψη / top-down sketch for the chat FAB, so the control
 *   reads as the hat without cloning the logo sitting in the header.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const STRAW = '#E4BD70';
const STRAW_WEAVE = '#C49B50';
const INK = '#3F2A1B';
const BAND = '#D84539';
const WHEAT_LIT = '#FDE68A';

/** Snappy enough to read as a spin; a full second would stall a control you tap often. */
export const HAT_SPIN_SECONDS = 0.42;

export function StrawHatMark({
  variant,
  className,
}: {
  variant: 'threeQuarter' | 'plan';
  className?: string;
}) {
  if (variant === 'plan') {
    return <PlanHat className={className} />;
  }
  return <ThreeQuarterHat className={className} />;
}

function ThreeQuarterHat({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 90"
      className={className}
      aria-hidden
      data-straw-hat="three-quarter"
    >
      <path d="M 35 60 C 20 65, 15 75, 25 80" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="60" cy="62" rx="55" ry="14" fill={STRAW} stroke={INK} strokeWidth="3" />
      <path d="M 15 62 Q 60 76 105 62 M 25 67 Q 60 80 95 67" fill="none" stroke={STRAW_WEAVE} strokeWidth="1.5" />
      <path d="M 32 60 C 32 20, 42 16, 60 16 C 78 16, 88 20, 88 60 Z" fill={STRAW} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 45 25 L 45 48 M 60 20 L 60 52 M 75 25 L 75 48" fill="none" stroke={STRAW_WEAVE} strokeWidth="2" strokeLinecap="round" />
      <path d="M 38 32 C 50 35, 70 35, 82 32 M 36 42 Q 60 48 84 42" fill="none" stroke={STRAW_WEAVE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 31.5 54 C 50 63, 70 63, 88.5 54 L 88.5 60 C 70 70, 50 70, 31.5 60 Z" fill={BAND} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M 32 62 C 25 58, 20 62, 22 66" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <path d="M 22 66 Q 16 75 20 85" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
      <g transform="translate(62, 79) rotate(-12)">
        <path d="M 0 0 Q 34 12 68 -2" fill="none" stroke={STRAW} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 46 4.8 Q 57 2 66 -1.2" fill="none" stroke={WHEAT_LIT} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 48 4.3 L 56 -1.5 M 52 3.3 L 60 -2.5 M 56 2.3 L 64 -3.5 M 60 1.3 L 68 -4.5 M 64 0.3 L 72 -5.5" fill="none" stroke={STRAW} strokeWidth="1" strokeLinecap="round" />
        <path d="M 48 4.3 L 56 10 M 52 3.3 L 60 9 M 56 2.3 L 64 8 M 60 1.3 L 68 7 M 64 0.3 L 72 6" fill="none" stroke={STRAW} strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Top-down sketch: round brim, crown, red band, short wheat in-frame. */
function PlanHat({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={cn('overflow-visible', className)}
      aria-hidden
      data-straw-hat="plan"
    >
      <ellipse cx="16" cy="17" rx="13.2" ry="12" fill={STRAW} stroke={INK} strokeWidth="1.7" />
      <ellipse cx="16" cy="17" rx="10.7" ry="9.7" fill="none" stroke={STRAW_WEAVE} strokeWidth="0.75" />
      <ellipse cx="16" cy="17" rx="8.5" ry="7.7" fill="none" stroke={STRAW_WEAVE} strokeWidth="0.55" />
      <path
        d="M8.4 12.4 10.2 13.4 M6.9 17 9.4 17 M8.4 21.6 10.2 20.6 M23.6 12.4 21.8 13.4 M25.1 17 22.6 17 M23.6 21.6 21.8 20.6"
        fill="none"
        stroke={STRAW_WEAVE}
        strokeWidth="0.7"
        strokeLinecap="round"
      />
      <path
        fill={BAND}
        stroke={INK}
        strokeWidth="1.2"
        fillRule="evenodd"
        d="M16 16.7 m -7.15 0 a 7.15 6.55 0 1 0 14.3 0 a 7.15 6.55 0 1 0 -14.3 0 M16 16.25 m -5.05 0 a 5.05 4.6 0 1 1 10.1 0 a 5.05 4.6 0 1 1 -10.1 0"
      />
      <ellipse cx="16" cy="15.7" rx="4.95" ry="4.5" fill={STRAW} stroke={INK} strokeWidth="1.3" />
      <ellipse cx="16" cy="15.5" rx="2.65" ry="2.4" fill="none" stroke={STRAW_WEAVE} strokeWidth="0.85" />
      <ellipse cx="16" cy="15.35" rx="1.05" ry="0.95" fill={STRAW_WEAVE} stroke={INK} strokeWidth="0.7" />
      <g transform="translate(23.2 6.4) rotate(-34)">
        <path d="M0 7.2 Q 3.1 3.8 6.2 0" fill="none" stroke={STRAW} strokeWidth="0.95" strokeLinecap="round" />
        <path d="M3.5 3.1 Q 4.9 1.5 6.1 0.15" fill="none" stroke={WHEAT_LIT} strokeWidth="1.35" strokeLinecap="round" />
        <path
          d="M3.6 3 L5.2 1.15 M4.25 2.6 L5.9 0.75 M4.9 2.2 L6.55 0.35"
          fill="none"
          stroke={STRAW}
          strokeWidth="0.55"
          strokeLinecap="round"
        />
        <path
          d="M3.6 3 L5.4 4.15 M4.25 2.6 L6.05 3.75 M4.9 2.2 L6.7 3.35"
          fill="none"
          stroke={STRAW}
          strokeWidth="0.55"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Clockwise on open, counterclockwise on close, with a slight pop / compress.
 * MotionConfig in main.tsx already zeroes this when the user prefers reduced motion.
 */
export function StrawHatSpin({
  open,
  className,
  markClassName,
}: {
  open: boolean;
  className?: string;
  markClassName?: string;
}) {
  const [rotate, setRotate] = useState(0);
  const [scale, setScale] = useState<number | number[]>(1);
  const ready = useRef(false);

  useEffect(() => {
    if (!ready.current) {
      ready.current = true;
      return;
    }
    setRotate((current) => current + (open ? 360 : -360));
    setScale(open ? [1, 1.12, 1] : [1, 0.78, 1]);
  }, [open]);

  return (
    <motion.span
      className={cn('inline-flex origin-center will-change-transform', className)}
      animate={{ rotate, scale }}
      transition={{ duration: HAT_SPIN_SECONDS, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <StrawHatMark variant="plan" className={markClassName} />
    </motion.span>
  );
}
