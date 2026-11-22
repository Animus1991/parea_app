const HASHTAG_RE = /#([\p{L}\p{N}_]+)/gu;

export function extractHashtags(text: string): string[] {
  return [...text.matchAll(HASHTAG_RE)].map((match) => match[1]);
}
