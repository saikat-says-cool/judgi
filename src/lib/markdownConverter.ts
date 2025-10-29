import { remark } from 'remark';
import remarkHtml from 'remark-html';
import gfm from 'remark-gfm';
import * as htmlToMarkdownModule from 'html-to-markdown'; // Import as a namespace

// Attempt to get the default export, or use the module itself if it's directly callable
const htmlToMarkdown = (htmlToMarkdownModule as any).default || htmlToMarkdownModule;

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
  // Ensure htmlToMarkdown is actually a function before calling it
  if (typeof htmlToMarkdown === 'function') {
    return htmlToMarkdown(html, {
      // Options can be configured here if needed
      // e.g., `gfm: true` for GitHub Flavored Markdown
    });
  } else {
    console.error("htmlToMarkdown is not a function after import attempt:", htmlToMarkdown);
    // Fallback: if conversion fails, return the original HTML or an empty string
    return html; 
  }
};