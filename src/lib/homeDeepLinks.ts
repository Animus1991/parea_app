import { parseHomeMoodParam } from './homeMoodConstants';

/** Deep links into Home filters (works with useHomeUrlFilters). */
export function homePathWithCategory(category: string): string {
  if (!category || category === 'All') return '/';
  return `/?cat=${encodeURIComponent(category)}`;
}

export function homePathWithSearch(query: string): string {
  const q = query.trim();
  if (!q) return '/';
  return `/?search=${encodeURIComponent(q)}`;
}

export function homePathWithTag(tag: string): string {
  const t = tag.trim();
  if (!t || t === 'All') return '/';
  return `/?tag=${encodeURIComponent(t)}`;
}

export function homePathWithMood(moodId: string): string {
  const id = parseHomeMoodParam(moodId);
  if (!id) return '/';
  return `/?mood=${encodeURIComponent(id)}`;
}
