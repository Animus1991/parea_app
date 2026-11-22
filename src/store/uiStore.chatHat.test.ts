import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from './uiStore';
import { DEFAULT_CHAT_HAT_STYLE } from '../lib/chatHatStyles';
import { MAX_CUSTOM_HAT_DATA_URL_CHARS } from '../lib/prepareChatHatImage';

const sample = {
  id: 'custom_test',
  src: 'data:image/png;base64,aaa',
  labelEl: 'Δικό μου 1',
  labelEn: 'My hat 1',
  custom: true as const,
};

describe('custom chat hats', () => {
  beforeEach(() => {
    useUIStore.setState({
      chatHatStyle: DEFAULT_CHAT_HAT_STYLE,
      dismissedChatHats: [],
      customChatHats: [],
    });
  });

  it('adds a custom hat and selects it', () => {
    expect(useUIStore.getState().addCustomChatHat(sample)).toBe(true);
    expect(useUIStore.getState().chatHatStyle).toBe('custom_test');
    expect(useUIStore.getState().customChatHats).toHaveLength(1);
  });

  it('refuses a hat that would overflow device storage', () => {
    expect(
      useUIStore.getState().addCustomChatHat({
        ...sample,
        id: 'custom_huge',
        src: `data:image/png;base64,${'a'.repeat(MAX_CUSTOM_HAT_DATA_URL_CHARS)}`,
      }),
    ).toBe(false);
    expect(useUIStore.getState().customChatHats).toHaveLength(0);
  });

  it('hides a built-in hat and restores it', () => {
    useUIStore.getState().dismissChatHat('01-plan');
    expect(useUIStore.getState().dismissedChatHats).toContain('01-plan');
    useUIStore.getState().restoreChatHats();
    expect(useUIStore.getState().dismissedChatHats).toEqual([]);
  });

  it('deletes a custom hat and falls back to a remaining style', () => {
    useUIStore.getState().addCustomChatHat(sample);
    useUIStore.getState().removeCustomChatHat('custom_test');
    expect(useUIStore.getState().customChatHats).toHaveLength(0);
    // Falls back to the first still-visible built-in style.
    expect(useUIStore.getState().chatHatStyle).toBe('drawn');
  });

  it('keeps the last remaining hat', () => {
    const allButDrawn = [
      '01-plan',
      '10-back',
      '02-three-quarter',
      '08-front',
      '14-front-weave',
      '07-low',
      '12-chinstrap',
      '03-table',
      '06-deck',
      '11-wall',
      '05-wear',
      '13-yellow-table',
      '09-side',
      '15-drawn-anime',
      '04-underside',
    ];
    for (const id of allButDrawn) useUIStore.getState().dismissChatHat(id);
    expect(useUIStore.getState().chatHatStyle).toBe('drawn');
    useUIStore.getState().dismissChatHat('drawn');
    expect(useUIStore.getState().dismissedChatHats).not.toContain('drawn');
  });
});
