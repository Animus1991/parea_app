/**
 * Original Nakamas “minis”: quiet geometric people we own.
 * Not affiliated with LEGO, Roblox, 16Personalities, or 64Personality.
 * Used sparingly — one figure per moment, never as page chrome.
 */
import type { ReactNode } from 'react';
import type { AchievementId } from '../../lib/achievements';
import { cn } from '../../lib/utils';

export const NAKAMAS_MINI_IDS = ['explorer', 'crew', 'host', 'trust', 'spark', 'helper'] as const;
export type NakamasMiniId = (typeof NAKAMAS_MINI_IDS)[number];

export const ACHIEVEMENT_MINI: Record<AchievementId, NakamasMiniId> = {
  first_experience: 'explorer',
  social_butterfly: 'crew',
  reliability_star: 'spark',
  weekly_streak: 'spark',
  trusted_member: 'trust',
  explorer: 'explorer',
  trailblazer: 'host',
  connector: 'crew',
};

export const CHALLENGE_MINI: Record<'events' | 'streak' | 'social' | 'explorer', NakamasMiniId> = {
  events: 'explorer',
  streak: 'spark',
  social: 'crew',
  explorer: 'explorer',
};

const INK = '#1e293b';
const SW = 1.6;

type ArmPose = 'down' | 'out' | 'hold' | 'up' | 'wave';

function Arm({
  side,
  pose,
  shirt,
  skin,
}: {
  side: 'left' | 'right';
  pose: ArmPose;
  shirt: string;
  skin: string;
}) {
  const cx = side === 'left' ? 27 : 53;
  const cy = 46;
  const angle = {
    down: side === 'left' ? 12 : -12,
    out: side === 'left' ? 72 : -72,
    hold: side === 'left' ? 50 : -50,
    up: side === 'left' ? 122 : -122,
    wave: side === 'left' ? 142 : -142,
  }[pose];
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      <rect x={cx - 3.4} y={cy} width="6.8" height="18" rx="3.4" fill={shirt} stroke={INK} strokeWidth={SW} />
      <circle cx={cx} cy={cy + 19.5} r="3.8" fill={skin} stroke={INK} strokeWidth={SW} />
    </g>
  );
}

function Face() {
  return (
    <>
      <circle cx="35.2" cy="23" r="1.45" fill={INK} />
      <circle cx="44.8" cy="23" r="1.45" fill={INK} />
      <path d="M35.5 27.2c2 2 7 2 9 0" stroke={INK} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </>
  );
}

function Figure({
  skin,
  shirt,
  pants,
  left = 'down',
  right = 'down',
  children,
}: {
  skin: string;
  shirt: string;
  pants: string;
  left?: ArmPose;
  right?: ArmPose;
  children?: ReactNode;
}) {
  return (
    <>
      <ellipse cx="40" cy="90.5" rx="13" ry="2.4" fill={INK} opacity="0.08" />
      <Arm side="left" pose={left} shirt={shirt} skin={skin} />
      <rect x="29" y="64" width="9" height="20" rx="4.5" fill={pants} stroke={INK} strokeWidth={SW} />
      <rect x="42" y="64" width="9" height="20" rx="4.5" fill={pants} stroke={INK} strokeWidth={SW} />
      <rect x="26" y="40" width="28" height="26" rx="10" fill={shirt} stroke={INK} strokeWidth={SW} />
      <Arm side="right" pose={right} shirt={shirt} skin={skin} />
      <circle cx="40" cy="22.5" r="12.5" fill={skin} stroke={INK} strokeWidth={SW} />
      {children}
      <Face />
    </>
  );
}

function ExplorerArt() {
  return (
    <>
      <Figure skin="#f1c7a4" shirt="#0891b2" pants="#164e63" left="hold" right="down">
        <path
          d="M28 16.5c3.5-7.5 14-9.5 21.5-4.5 1.4 1 .8 3.2-.8 3.8-5.5 2.2-13 2.4-19.5.2-1.2-.4-2-.8-1.2-2.5z"
          fill="#0e7490"
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
      </Figure>
      <circle cx="16" cy="66" r="6.2" fill="#fffbeb" stroke={INK} strokeWidth={SW} />
      <circle cx="16" cy="66" r="1.7" fill="#f59e0b" />
    </>
  );
}

function CrewArt() {
  return (
    <Figure skin="#c48a62" shirt="#f59e0b" pants="#7c2d12" left="down" right="wave">
      <path
        d="M29 14c2.5-6 9-8 16-5.5 2 4.5-1 8-6 9.2-5.5.8-11-1-10-3.7z"
        fill="#1e293b"
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Figure>
  );
}

function HostArt() {
  return (
    <>
      <Figure skin="#8d5a3b" shirt="#1e293b" pants="#334155" left="down" right="out">
        <path
          d="M28 15c6.5-7 18-7 23.5 1.2.6 4.5-3.5 7.2-8.5 7.8H36c-5-.6-8.8-3.4-8-9z"
          fill="#0f172a"
          stroke={INK}
          strokeWidth={SW}
        />
      </Figure>
      <rect x="10" y="54" width="12" height="15" rx="2.5" fill="#fffbeb" stroke={INK} strokeWidth={SW} />
      <path d="M13 59h6M13 63h6M13 67h3.5" stroke="#0891b2" strokeWidth="1.3" strokeLinecap="round" />
    </>
  );
}

function TrustArt() {
  return (
    <>
      <Figure skin="#e8b896" shirt="#0f766e" pants="#134e4a" left="hold" right="hold">
        <path
          d="M28 16c5.5-7.5 18.5-7.5 24 0-1.5 4.5-6.5 6.8-12 6.8S29.5 20.5 28 16z"
          fill="#115e59"
          stroke={INK}
          strokeWidth={SW}
        />
      </Figure>
      <path
        d="M40 50.5 48 54.5v6.5c0 5-3.2 8-8 9.5-4.8-1.5-8-4.5-8-9.5v-6.5z"
        fill="#ecfdf5"
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <path d="M37 62.2 39.4 64.5 43.6 59.5" stroke="#0f766e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
}

function SparkArt() {
  return (
    <Figure skin="#f1c7a4" shirt="#ea580c" pants="#9a3412" left="up" right="up">
      <path
        d="M31 18 34.5 10l4 6.5L43 9l3 8 7-2.5-1.5 9H32z"
        fill="#fb923c"
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
    </Figure>
  );
}

function HelperArt() {
  return (
    <Figure skin="#c48a62" shirt="#06b6d4" pants="#155e75" left="down" right="out">
      <path
        d="M27.5 18c3-8.5 13-11 21.5-7.5 2.5 5.5-1.5 9.5-7.5 11H35c-5 0-8.5-1-7.5-3.5z"
        fill="#164e63"
        stroke={INK}
        strokeWidth={SW}
      />
    </Figure>
  );
}

const ART: Record<NakamasMiniId, () => ReactNode> = {
  explorer: ExplorerArt,
  crew: CrewArt,
  host: HostArt,
  trust: TrustArt,
  spark: SparkArt,
  helper: HelperArt,
};

interface NakamasMiniProps {
  id: NakamasMiniId;
  size?: number;
  title?: string;
  className?: string;
}

export function NakamasMini({ id, size = 48, title, className }: NakamasMiniProps) {
  const Art = ART[id];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {Art()}
    </svg>
  );
}
