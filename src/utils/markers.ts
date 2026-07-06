const HTML_MARKER = '<!-- managed-by: aide -->';
const FRONTMATTER_MARKER_KEY = 'managedBy: aide';
const FRONTMATTER_DELIMITER = /^---\r?\n/;

export function hasFrontmatter(content: string): boolean {
  return FRONTMATTER_DELIMITER.test(content);
}

function getFrontmatterBlock(content: string): string | null {
  if (!hasFrontmatter(content)) {
    return null;
  }

  const closingIndex = content.indexOf('\n---', 3);
  return closingIndex === -1 ? content : content.slice(0, closingIndex);
}

export function hasManagedMarker(content: string): boolean {
  const frontmatter = getFrontmatterBlock(content);

  if (frontmatter !== null) {
    return frontmatter.includes(FRONTMATTER_MARKER_KEY);
  }

  return content.includes(HTML_MARKER);
}

export function addManagedMarker(content: string): string {
  if (hasManagedMarker(content)) {
    return content;
  }

  if (hasFrontmatter(content)) {
    return content.replace(FRONTMATTER_DELIMITER, (match) => `${match}${FRONTMATTER_MARKER_KEY}\n`);
  }

  return `${HTML_MARKER}\n\n${content}`;
}
