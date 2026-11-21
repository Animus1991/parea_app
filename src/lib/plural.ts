/**
 * A count with the matching noun form: «1 εκδήλωση», «3 εκδηλώσεις»,
 * "1 event", "3 events". Greek and English both switch only between one and many.
 */
export function countNoun(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
