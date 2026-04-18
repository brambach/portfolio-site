import { TOPICS, type Topic } from './content';

export function matchTopic(text: string): Topic | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const topic of TOPICS) {
    for (const kw of topic.keywords) {
      if (lower.includes(kw.toLowerCase())) return topic;
    }
  }
  return null;
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
