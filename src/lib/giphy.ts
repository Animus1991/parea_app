import { foldSearchText } from './greekText';
import { GIPHY_CATALOG, makeStickerSvg, type GiphyCategory, type GiphyItem } from './chatMediaCatalog';

const API_KEY = import.meta.env.VITE_GIPHY_API_KEY?.trim();
const GIPHY_API = 'https://api.giphy.com/v1/gifs';

interface GiphyResponse {
  data?: Array<{
    id?: string;
    title?: string;
    images?: { fixed_height?: { url?: string } };
  }>;
}

function localSearch(query: string): GiphyItem[] {
  const needle = foldSearchText(query);
  if (!needle) return GIPHY_CATALOG;
  return GIPHY_CATALOG.filter((gif) =>
    foldSearchText([gif.titleEl, gif.titleEn, ...gif.keywords].join(' ')).includes(needle),
  );
}

function categoryFor(title: string): GiphyCategory {
  const normalized = foldSearchText(title);
  if (/love|heart|kiss|αγαπ|καρδ/.test(normalized)) return 'love';
  if (/laugh|funny|lol|haha|γελ/.test(normalized)) return 'laugh';
  if (/thank|cheer|ευχαρισ|ευγνω/.test(normalized)) return 'thanks';
  if (/yes|no|okay|agree|ναι|οχι|μέσα/.test(normalized)) return 'yesno';
  if (/party|celebr|excited|joy|γιορτ|χαρ/.test(normalized)) return 'joy';
  return 'social';
}

async function fetchGifs(endpoint: 'search' | 'trending', query = ''): Promise<GiphyItem[] | null> {
  if (!API_KEY) return null;
  try {
    const params = new URLSearchParams({ api_key: API_KEY, limit: '24', rating: 'pg-13' });
    if (endpoint === 'search' && query.trim()) params.set('q', query.trim());
    const response = await fetch(`${GIPHY_API}/${endpoint}?${params}`);
    if (!response.ok) return null;
    const payload = (await response.json()) as GiphyResponse;
    const results = (payload.data ?? []).flatMap((gif) => {
      const url = gif.images?.fixed_height?.url;
      if (!gif.id || !url) return [];
      const title = gif.title?.trim() || 'Nakamas GIF';
      const fallbackSvgDataUrl = makeStickerSvg('#0ea5e9', '#6366f1', '✨', title.slice(0, 24));
      return [{
        id: gif.id,
        titleEl: title,
        titleEn: title,
        keywords: [title],
        category: categoryFor(title),
        url,
        fallbackSvgDataUrl,
      }];
    });
    return results.length ? results : null;
  } catch {
    return null;
  }
}

export async function searchGifs(query: string): Promise<GiphyItem[]> {
  const normalized = query.trim();
  if (!normalized) return (await trendingGifs());
  return (await fetchGifs('search', normalized)) ?? localSearch(normalized);
}

export async function trendingGifs(): Promise<GiphyItem[]> {
  return (await fetchGifs('trending')) ?? GIPHY_CATALOG;
}
