/** The addresses with a page in the loupe look (chapters.ts builds them). Kept apart so the router can ask without
 *  loading every project's words. The AI teammate's old named address shows the same unnamed page. */
export const CHAPTER_ROUTES = ['ai-teammate', 'jared', 'psyche', 'dervo', 'trace', 'easeprint', 'dryline', 'comehome', 'arro'] as const;
export const hasChapter = (id: string) => (CHAPTER_ROUTES as readonly string[]).includes(id);
