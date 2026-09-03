/** The tiny subset of Markdown the readings use: **bold** and *italic*.
 *
 * Ported from the render_md filter in app.py, and it keeps that version's
 * ordering: escape first, THEN substitute. Doing it the other way round lets
 * a card meaning containing a literal < break out of the text node.
 */

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (ch) => ESCAPES[ch])
}

/** Returns HTML. Callers put it in dangerouslySetInnerHTML, which is safe
 *  precisely because the escape above already ran. */
export function renderMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
}

/** Same subset, but flattened to plain text -- for <title>, meta
 *  descriptions and anywhere else markup would leak into an attribute. */
export function stripMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
}
