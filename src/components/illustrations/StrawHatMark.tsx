/**
 * Nakamas straw hat, two camera angles on purpose:
 * - threeQuarter: the wordmark glyph (same drawing as the header logo).
 * - plan: high-angle κάτοψη for the chat FAB — crown, brim and red band
 *   with woven straw, so it reads as the hat without cloning the logo.
 */
import { useEffect, useId, useRef, useState } from 'react';
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

/** Concentric straw coils — the weave that makes a boater look like straw, not a target. */
function CoilRings({
  cx,
  cy,
  rx,
  ry,
  count,
  inner = 0.12,
  stroke,
  width = 0.7,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  count: number;
  inner?: number;
  stroke: string;
  width?: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 1) / (count + 1);
        const k = 1 - t * (1 - inner);
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy}
            rx={rx * k}
            ry={ry * k}
            fill="none"
            stroke={stroke}
            strokeWidth={width}
            opacity={0.28 + (i % 2) * 0.16}
          />
        );
      })}
    </>
  );
}

/**
 * High-angle κάτοψη: still from above, but with crown height so it reads as the
 * straw boater in the photo refs — not a flat bullseye, and not the header logo.
 */
function PlanHat({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const brimFill = `${uid}-brim`;
  const crownFill = `${uid}-crown`;
  const wallFill = `${uid}-wall`;
  const bandFill = `${uid}-band`;
  const brimClip = `${uid}-brim-clip`;
  const crownClip = `${uid}-crown-clip`;
  const shade = `${uid}-shade`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 160"
      className={cn('overflow-visible', className)}
      aria-hidden
      data-straw-hat="plan"
    >
      <defs>
        <radialGradient id={brimFill} cx="42%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#F7E4B4" />
          <stop offset="45%" stopColor="#E8C57A" />
          <stop offset="100%" stopColor="#C4964A" />
        </radialGradient>
        <radialGradient id={crownFill} cx="38%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FBECC4" />
          <stop offset="55%" stopColor="#E4BD70" />
          <stop offset="100%" stopColor="#C49B50" />
        </radialGradient>
        <linearGradient id={wallFill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EED392" />
          <stop offset="45%" stopColor="#D7B060" />
          <stop offset="100%" stopColor="#B88940" />
        </linearGradient>
        <linearGradient id={bandFill} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0564A" />
          <stop offset="40%" stopColor="#E03A32" />
          <stop offset="100%" stopColor="#B7201C" />
        </linearGradient>
        <radialGradient id={shade} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3F2A1B" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3F2A1B" stopOpacity="0" />
        </radialGradient>
        <clipPath id={brimClip}>
          <ellipse cx="80" cy="96" rx="74" ry="52" />
        </clipPath>
        <clipPath id={crownClip}>
          <ellipse cx="80" cy="52" rx="33" ry="20" />
        </clipPath>
      </defs>

      <ellipse cx="82" cy="148" rx="62" ry="10" fill="#3F2A1B" opacity="0.2" />

      {/* Brim thickness, then the woven disc — rounder so it still fills the FAB. */}
      <ellipse cx="80" cy="102" rx="75" ry="53" fill="#B07A38" />
      <ellipse cx="80" cy="96" rx="74" ry="52" fill={`url(#${brimFill})`} stroke="#8A5A28" strokeWidth="1.5" />
      <g clipPath={`url(#${brimClip})`}>
        <CoilRings cx={80} cy={96} rx={72} ry={50} count={13} inner={0.36} stroke="#C49B50" width={1.1} />
        <CoilRings cx={80} cy={96} rx={72} ry={50} count={13} inner={0.36} stroke="#F3DEAA" width={0.5} />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const inner = 0.4;
          const outer = 0.98;
          return (
            <line
              key={i}
              x1={80 + Math.cos(a) * 74 * inner}
              y1={96 + Math.sin(a) * 52 * inner}
              x2={80 + Math.cos(a) * 74 * outer}
              y2={96 + Math.sin(a) * 52 * outer}
              stroke="#A67C3A"
              strokeWidth="0.55"
              opacity="0.26"
            />
          );
        })}
        <ellipse cx="80" cy="96" rx="38" ry="26" fill={`url(#${shade})`} />
      </g>

      {/* Crown wall — short cylinder sitting on the brim. */}
      <path
        d="M47 52 A33 20 0 0 1 113 52 L116 86 A36 18 0 0 1 44 86 Z"
        fill={`url(#${wallFill})`}
        stroke="#8A5A28"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {Array.from({ length: 6 }, (_, i) => {
        const y = 58 + i * 4.6;
        const rx = 33 + i * 0.5;
        return (
          <ellipse
            key={i}
            cx="80"
            cy={y}
            rx={rx}
            ry="11"
            fill="none"
            stroke="#C49B50"
            strokeWidth="0.9"
            opacity="0.42"
          />
        );
      })}

      {/* Red band around the crown base. */}
      <path
        d="M45 76 L44.5 88 A36 16 0 0 0 115.5 88 L115 76 A35 15 0 0 1 45 76 Z"
        fill={`url(#${bandFill})`}
        stroke="#8E1C18"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M48 78 A33 13 0 0 1 112 78"
        fill="none"
        stroke="#FF7A70"
        strokeWidth="1.5"
        opacity="0.45"
        strokeLinecap="round"
      />
      <path
        d="M49 86 A32 12 0 0 0 111 86"
        fill="none"
        stroke="#7A1412"
        strokeWidth="1.2"
        opacity="0.35"
        strokeLinecap="round"
      />

      {/* Crown top — spiral coils like the photo refs. */}
      <ellipse cx="80" cy="52" rx="33" ry="20" fill={`url(#${crownFill})`} stroke="#8A5A28" strokeWidth="1.4" />
      <g clipPath={`url(#${crownClip})`}>
        <CoilRings cx={80} cy={52} rx={31.5} ry={18.5} count={9} inner={0.08} stroke="#C49B50" width={1} />
        <CoilRings cx={80} cy={52} rx={31.5} ry={18.5} count={9} inner={0.08} stroke="#F8E7B8" width={0.4} />
        <ellipse cx="70" cy="46" rx="13" ry="8" fill="#FFF6D8" opacity="0.28" />
      </g>
      <ellipse cx="80" cy="52" rx="4" ry="2.4" fill="#C49B50" stroke="#8A5A28" strokeWidth="0.7" />
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
  src,
}: {
  open: boolean;
  className?: string;
  markClassName?: string;
  src?: string;
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
      {src ? (
        <img src={src} alt="" draggable={false} className={cn('object-contain', markClassName)} />
      ) : (
        <StrawHatMark variant="plan" className={markClassName} />
      )}
    </motion.span>
  );
}
