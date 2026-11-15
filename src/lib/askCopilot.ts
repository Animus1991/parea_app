/**
 * Thin bridge from empty states / CTAs into Nakamas AI (CFB-style Ask AI).
 * Keeps page context by opening the existing docked/mobile copilot with a prompt.
 */
import { openCopilot } from '../ai/copilot';

export function askCopilot(prompt?: string): void {
  openCopilot(prompt);
}

/** Default bilingual Ask-AI empty secondary when a page does not customise it. */
export const ASK_AI_EMPTY = {
  labelEl: 'Ρώτα το AI',
  labelEn: 'Ask AI',
  promptEl: 'Βοήθησέ με να βρω τι να κάνω εδώ',
  promptEn: 'Help me figure out what to do here',
} as const;
