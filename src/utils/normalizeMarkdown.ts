const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s/

// A `**…**` pair on one line, and the character directly after it when that is a letter, a digit
// or the start of a link. The opening marker must touch its text, so that `2 ** 3` in a formula
// is not taken for a pair.
const BOLD_PAIR = /\*\*(?!\s)([^*\n]+?)\*\*([\p{L}\p{N}[])?/gu

const isListItem = (line: string | undefined): boolean => line !== undefined && LIST_ITEM.test(line)

/**
 * CommonMark does not let `**` close bold text when it comes after punctuation and directly
 * before a letter, so `**Study ID:**E5204` stays on the page as raw asterisks. A space after the
 * pair lets it close, and also keeps a label apart from a link that follows it. The end of the text in the pair is trimmed for the same reason: `**Label: **`
 * does not close either.
 */
const repairBold = (line: string): string =>
  line.replace(BOLD_PAIR, (_match: string, inner: string, next: string | undefined) => {
    const label = inner.trimEnd()
    return next === undefined ? `**${label}**` : `**${label}** ${next}`
  })

/**
 * Prepares a description for a Markdown renderer.
 *
 * Descriptions are plain text that people (and the dbGaP integration) write with one line per
 * paragraph, heading or list item. Markdown reads a single line break as a space, and lets a list
 * take the lines that come after it, so the text is rendered as one block with the lines after a
 * list inside its last item. Here every line break becomes a paragraph break, except between
 * two adjacent list items, which stay one list.
 */
export const normalizeMarkdown = (text: string): string => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
  return lines
    .map((line, index) => {
      const continuesList = isListItem(line) && isListItem(lines[index - 1])
      // After a blank line, four spaces of indentation start a code block. Only an item that
      // continues a list keeps its indentation, which is what nests it.
      const repaired = repairBold(continuesList ? line : line.trimStart())
      if (index === lines.length - 1) return repaired
      return isListItem(line) && isListItem(lines[index + 1]) ? `${repaired}\n` : `${repaired}\n\n`
    })
    .join('')
}
