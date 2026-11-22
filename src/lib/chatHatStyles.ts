/** Same box as the live chat FAB — keep picker hats at this size. */
export const CHAT_HAT_FAB = 'w-24 h-24 md:w-28 md:h-28';

export type ChatHatStyle = {
  id: string;
  src?: string;
  labelEl: string;
  labelEn: string;
  custom?: boolean;
};

/** Photo cutouts from the user's refs, plus the current drawn κάτοψη. */
export const CHAT_HAT_STYLES: ChatHatStyle[] = [
  { id: 'drawn', labelEl: 'Σκίτσο κάτοψη', labelEn: 'Drawn plan view' },
  { id: '01-plan', src: '/chat-hats/01-plan.png', labelEl: 'Κάτοψη', labelEn: 'Plan view' },
  { id: '10-back', src: '/chat-hats/10-back.png', labelEl: 'Πίσω κάτοψη', labelEn: 'Back view' },
  { id: '02-three-quarter', src: '/chat-hats/02-three-quarter.png', labelEl: '3/4 άνω', labelEn: 'High 3/4' },
  { id: '08-front', src: '/chat-hats/08-front.png', labelEl: 'Μπροστά', labelEn: 'Front' },
  { id: '14-front-weave', src: '/chat-hats/14-front-weave.png', labelEl: 'Ψάθα μπροστά', labelEn: 'Woven front' },
  { id: '07-low', src: '/chat-hats/07-low.png', labelEl: 'Χαμηλή γωνία', labelEn: 'Low angle' },
  { id: '12-chinstrap', src: '/chat-hats/12-chinstrap.png', labelEl: 'Με λουρί', labelEn: 'Chin strap' },
  { id: '03-table', src: '/chat-hats/03-table.png', labelEl: 'Τραπέζι', labelEn: 'Table' },
  { id: '06-deck', src: '/chat-hats/06-deck.png', labelEl: 'Πλώρη', labelEn: 'Deck' },
  { id: '11-wall', src: '/chat-hats/11-wall.png', labelEl: 'Κρεμαστό', labelEn: 'Hung' },
  { id: '05-wear', src: '/chat-hats/05-wear.png', labelEl: 'Φορεμένο', labelEn: 'Worn' },
  { id: '13-yellow-table', src: '/chat-hats/13-yellow-table.png', labelEl: 'Κίτρινο τραπέζι', labelEn: 'Yellow table' },
  { id: '09-side', src: '/chat-hats/09-side.png', labelEl: 'Πλάι', labelEn: 'Side' },
  { id: '15-drawn-anime', src: '/chat-hats/15-drawn-anime.png', labelEl: 'Σκίτσο πλάι', labelEn: 'Side sketch' },
  { id: '04-underside', src: '/chat-hats/04-underside.png', labelEl: 'Από κάτω', labelEn: 'Underside' },
];

export const DEFAULT_CHAT_HAT_STYLE = '01-plan';

export function isCustomChatHat(value: unknown): value is ChatHatStyle {
  if (!value || typeof value !== 'object') return false;
  const hat = value as ChatHatStyle;
  return (
    typeof hat.id === 'string' &&
    hat.id.startsWith('custom_') &&
    typeof hat.src === 'string' &&
    hat.src.startsWith('data:image/') &&
    typeof hat.labelEl === 'string' &&
    typeof hat.labelEn === 'string'
  );
}

export function chatHatById(
  id: string,
  custom: readonly ChatHatStyle[] = [],
): ChatHatStyle | undefined {
  return custom.find((h) => h.id === id) ?? CHAT_HAT_STYLES.find((h) => h.id === id);
}

export function visibleChatHats(
  custom: readonly ChatHatStyle[],
  dismissed: readonly string[],
): ChatHatStyle[] {
  const builtIn = CHAT_HAT_STYLES.filter((h) => !dismissed.includes(h.id));
  return [...custom.filter((h) => h.src).map((h) => ({ ...h, custom: true as const })), ...builtIn];
}
