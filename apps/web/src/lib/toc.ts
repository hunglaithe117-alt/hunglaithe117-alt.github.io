/** A heading's viewport distance, as `getBoundingClientRect().top` reports it. */
export interface HeadingPosition {
  id: string;
  top: number;
}

interface ResolveActiveOptions {
  /** Pixels from the viewport top at which a heading counts as reached. */
  offset?: number;
  /** True once the reader has reached the bottom of the page. */
  atBottom?: boolean;
}

/**
 * Picks the TOC entry for the section being read.
 *
 * `headings` is in document order. Three cases are handled here:
 * - No headings: `null`, so the rail stays unmarked.
 * - `atBottom`: the last heading, because a short closing section can never
 *   scroll far enough to cross `offset` on its own.
 * - Otherwise: the last heading that has crossed `offset`, falling back to the
 *   first so the rail marks a section while the reader is still in the intro.
 *
 * A `#hash` target is not special-cased: the browser has already scrolled that
 * heading to the top, so it is the crossed heading like any other.
 */
export function resolveActiveHeadingId(
  headings: readonly HeadingPosition[],
  { offset = 120, atBottom = false }: ResolveActiveOptions = {},
): string | null {
  if (headings.length === 0) return null;
  if (atBottom) return headings[headings.length - 1].id;

  let active = headings[0].id;
  for (const heading of headings) {
    if (heading.top > offset) break;
    active = heading.id;
  }
  return active;
}
