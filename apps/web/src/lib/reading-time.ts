/** Reading-time estimate (~200 words/min). */
const WORDS_PER_MINUTE = 200;

export function countWords(text: string): number {
  const matches = text.trim().match(/[\p{L}\p{N}]+/gu);
  return matches ? matches.length : 0;
}

/** Whole minutes, never below 1. */
export function readingTimeMinutes(text: string, wordsPerMinute = WORDS_PER_MINUTE): number {
  const words = countWords(text);
  return Math.max(1, Math.round(words / wordsPerMinute));
}

/** Convenience wrapper for a content entry that may retain its raw body. */
export function readingTimeFor(body: string | undefined): number {
  return readingTimeMinutes(body ?? "");
}
