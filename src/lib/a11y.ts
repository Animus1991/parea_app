import type { KeyboardEvent, MouseEvent } from 'react';

/**
 * Props that make a non-button element (card, calendar cell, row) usable
 * from the keyboard: focusable, announced as a button, Enter/Space activate.
 * Use when a real <button> is not possible (it contains other controls or
 * block layout that a button cannot hold).
 */
export function pressable<T extends HTMLElement>(onPress: (e: MouseEvent<T> | KeyboardEvent<T>) => void) {
  return {
    role: 'button' as const,
    tabIndex: 0,
    onClick: (e: MouseEvent<T>) => onPress(e),
    onKeyDown: (e: KeyboardEvent<T>) => {
      if (e.target !== e.currentTarget) return; // keys on inner controls stay theirs
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPress(e);
      }
    },
  };
}

/**
 * Wrapper that only stops click/keyboard events from bubbling to a clickable
 * parent (e.g. action buttons inside a pressable card). Not interactive itself.
 */
export const stopBubbling = {
  role: 'presentation' as const,
  onClick: (e: MouseEvent) => e.stopPropagation(),
  onKeyDown: (e: KeyboardEvent) => e.stopPropagation(),
};
