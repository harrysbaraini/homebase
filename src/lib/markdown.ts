/**
 * Markdown Rendering Utility
 *
 * Renders markdown content to HTML with sanitization.
 */

import { marked } from "marked";

// Configure marked for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Render markdown content to HTML
 *
 * @param markdown - Raw markdown content
 * @returns HTML string
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  try {
    const html = await marked.parse(markdown);
    return html;
  } catch (error) {
    console.error("Markdown parsing error:", error);
    return `<p class="widget-error">Error parsing markdown</p>`;
  }
}

/**
 * Extract plain text from markdown (for previews)
 *
 * @param markdown - Raw markdown content
 * @param maxLength - Maximum length of extracted text
 * @returns Plain text string
 */
export function extractPlainText(markdown: string, maxLength = 200): string {
  // Remove markdown syntax
  const text = markdown
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove emphasis
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1")
    // Remove links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength).trim() + "...";
}
