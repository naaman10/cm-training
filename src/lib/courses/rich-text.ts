/**
 * Best-effort plain text from a Contentful Rich Text document.
 */
export function richTextToPlainText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value !== "object") return "";

  const node = value as {
    nodeType?: string;
    value?: string;
    content?: unknown[];
  };

  if (node.nodeType === "text" && typeof node.value === "string") {
    return node.value;
  }

  if (!Array.isArray(node.content)) return "";

  return node.content
    .map((child) => richTextToPlainText(child))
    .join(node.nodeType === "paragraph" ? "\n\n" : "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
