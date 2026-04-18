import { TOPICS, type Topic } from './content';

export function matchTopic(text: string): Topic | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const topic of TOPICS) {
    for (const kw of topic.keywords) {
      if (containsPhrase(lower, kw.toLowerCase())) return topic;
    }
  }
  return null;
}

/**
 * Whole-phrase substring check. Unlike `String.includes`, the phrase
 * must be preceded and followed by a word boundary so "your work"
 * does NOT match inside "your workflow" or "worked".
 */
function containsPhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  let from = 0;
  while (from <= text.length - phrase.length) {
    const idx = text.indexOf(phrase, from);
    if (idx < 0) return false;
    const before = idx === 0 ? '' : text[idx - 1];
    const after =
      idx + phrase.length >= text.length ? '' : text[idx + phrase.length];
    if (isWordBoundary(before) && isWordBoundary(after)) return true;
    from = idx + 1;
  }
  return false;
}

function isWordBoundary(ch: string): boolean {
  if (ch === '') return true;
  // Any non-letter, non-digit counts as a boundary. \p{L} and \p{N}
  // cover Unicode letters/numbers including accented (é, ü, ñ, etc.).
  return !/[\p{L}\p{N}]/u.test(ch);
}

export type Segment = { text: string; isKeyword: boolean };

export function segmentByKeywords(text: string, keywords: string[]): Segment[] {
  if (!text) return [];
  if (keywords.length === 0) return [{ text, isKeyword: false }];

  const segments: Segment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIdx = -1;
    let earliestLen = 0;

    for (const kw of keywords) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase());
      if (idx < 0) continue;
      if (
        earliestIdx === -1 ||
        idx < earliestIdx ||
        (idx === earliestIdx && kw.length > earliestLen)
      ) {
        earliestIdx = idx;
        earliestLen = kw.length;
      }
    }

    if (earliestIdx === -1) {
      segments.push({ text: remaining, isKeyword: false });
      break;
    }

    if (earliestIdx > 0) {
      segments.push({ text: remaining.slice(0, earliestIdx), isKeyword: false });
    }
    segments.push({
      text: remaining.slice(earliestIdx, earliestIdx + earliestLen),
      isKeyword: true,
    });
    remaining = remaining.slice(earliestIdx + earliestLen);
  }

  return segments;
}
