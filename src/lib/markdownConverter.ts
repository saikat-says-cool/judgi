import { remark } from 'remark';
import remarkHtml from 'remark-html';
import gfm from 'remark-gfm'; // Corrected import
import { htmlToMarkdown } from 'html-to-markdown'; // Using the installed package

/**
 * Converts Markdown string to HTML string.
 * @param markdown The Markdown string to convert.
 * @returns The HTML string.
 */
export const markdownToHtml = async (markdown: string): Promise<string> => {
  const file = await remark().use(gfm).use(remarkHtml).process(markdown);
  return String(file);
};

/**
 * Converts HTML string to Markdown string.
 * @param html The HTML string to convert.
 * @returns The Markdown string.
 */
export const htmlToMarkdownConverter = (html: string): string => {
  return htmlToMarkdown(html, {
    // Options can be configured here if needed
    // e.g., `gfm: true` for GitHub Flavored Markdown
  });
};