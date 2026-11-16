/**
 * Invitation covers (Φ27, after Partiful's themes — kept gentle): four per
 * kind of outing. Every cover pairs its gradient with a text colour that keeps
 * at least 4.5:1 contrast on both gradient stops (checked in a unit test).
 */
export interface PlanCover {
  id: string;
  el: string;
  en: string;
  from: string;
  to: string;
  ink: string;
}

const COVERS: Record<string, PlanCover[]> = {
  music: [
    { id: 'music-night', el: 'Νύχτα', en: 'Night', from: '#1b1f3b', to: '#3a2a5c', ink: '#ffffff' },
    { id: 'music-neon', el: 'Νέον', en: 'Neon', from: '#0f3b46', to: '#164e63', ink: '#ffffff' },
    { id: 'music-sunset', el: 'Ηλιοβασίλεμα', en: 'Sunset', from: '#7c2d12', to: '#9a3412', ink: '#ffffff' },
    { id: 'music-paper', el: 'Χαρτί', en: 'Paper', from: '#fdf6e3', to: '#f3e8d0', ink: '#3b2f1e' },
  ],
  outdoors: [
    { id: 'out-forest', el: 'Δάσος', en: 'Forest', from: '#14532d', to: '#166534', ink: '#ffffff' },
    { id: 'out-sea', el: 'Θάλασσα', en: 'Sea', from: '#0c4a6e', to: '#075985', ink: '#ffffff' },
    { id: 'out-stone', el: 'Πέτρα', en: 'Stone', from: '#e7e5e4', to: '#d6d3d1', ink: '#1c1917' },
    { id: 'out-morning', el: 'Πρωινό', en: 'Morning', from: '#fef3c7', to: '#fde68a', ink: '#422006' },
  ],
  culture: [
    { id: 'cult-velvet', el: 'Βελούδο', en: 'Velvet', from: '#4c0519', to: '#831843', ink: '#ffffff' },
    { id: 'cult-ink', el: 'Μελάνι', en: 'Ink', from: '#111827', to: '#1f2937', ink: '#ffffff' },
    { id: 'cult-marble', el: 'Μάρμαρο', en: 'Marble', from: '#f8fafc', to: '#e2e8f0', ink: '#0f172a' },
    { id: 'cult-olive', el: 'Ελιά', en: 'Olive', from: '#3f6212', to: '#4d7c0f', ink: '#ffffff' },
  ],
  social: [
    { id: 'soc-teal', el: 'Nakamas', en: 'Nakamas', from: '#0b6d6f', to: '#0a5f61', ink: '#ffffff' },
    { id: 'soc-coral', el: 'Κοράλλι', en: 'Coral', from: '#9f1239', to: '#be123c', ink: '#ffffff' },
    { id: 'soc-sand', el: 'Άμμος', en: 'Sand', from: '#faf5ef', to: '#efe4d6', ink: '#3b2a17' },
    { id: 'soc-plum', el: 'Δαμάσκηνο', en: 'Plum', from: '#3b0764', to: '#581c87', ink: '#ffffff' },
  ],
};

const FAMILY: Record<string, keyof typeof COVERS> = {
  'live music': 'music',
  'electronic music': 'music',
  'stand-up': 'music',
  hiking: 'outdoors',
  'nearby escapes': 'outdoors',
  sports: 'outdoors',
  'walking tours': 'outdoors',
  wellness: 'outdoors',
  cinema: 'culture',
  'theater & dance': 'culture',
  museums: 'culture',
  exhibitions: 'culture',
  'book club': 'culture',
};

export function coversFor(category: string | undefined): PlanCover[] {
  const fam = FAMILY[(category ?? '').toLowerCase()] ?? 'social';
  return COVERS[fam];
}

export function coverById(id: string | undefined, category?: string): PlanCover {
  const all = Object.values(COVERS).flat();
  return all.find((c) => c.id === id) ?? coversFor(category)[0];
}

export const ALL_COVERS: PlanCover[] = Object.values(COVERS).flat();
