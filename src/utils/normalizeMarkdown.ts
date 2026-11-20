// `+` and a number of three or more digits are not list markers here: in a description they are
// `+ 5 participants` and `2007. The survey started.`
const LIST_ITEM = /^\s*(?:[-*]|\d{1,2}[.)])\s/

// A line start that Markdown would take for a block quote, a `+` list item or a code fence.
const LITERAL_LINE_START = /^(?:>|\+|`{3,}|~{3,})/

const LARGE_NUMBER_MARKER = /^(\d{3,})([.)])/

// A `**…**` pair on one line, and the character directly after it when that is a letter, a digit
// or the start of a link. The opening marker must touch its text, so that `2 ** 3` in a formula
// is not taken for a pair.
const BOLD_PAIR = /\*\*(?!\s)([^*\n]+?)\*\*([\p{L}\p{N}[])?/gu

const ENDS_WITH_PUNCTUATION = /[\p{P}\p{S}]$/u

const isListItem = (line: string | undefined): boolean => line !== undefined && LIST_ITEM.test(line)

const indentOf = (line: string): number => line.length - line.trimStart().length

/**
 * CommonMark does not let `**` close bold text when it comes after punctuation and directly
 * before a letter, so `**Study ID:**E5204` stays on the page as raw asterisks. A space after the
 * pair lets it close, and also keeps a label apart from a link that follows it. A space at the
 * end of the text in the pair stops the close too, so `**Label: **value` gets the same repair.
 *
 * A pair that closes without help is left as it is: a space in `**BRCA**1` would change the name.
 * Known limit: a pair in a code span or a URL gets the space too.
 */
const repairBold = (line: string): string =>
  line.replace(BOLD_PAIR, (_match: string, inner: string, next: string | undefined) => {
    const label = inner.trimEnd()
    const cannotClose = label !== inner || ENDS_WITH_PUNCTUATION.test(label)
    const separator = next !== undefined && cannotClose ? ' ' : ''
    return `**${label}**${separator}${next ?? ''}`
  })

// Each line stands alone after the clean-up, so a line that starts with `>` would become a block
// quote and lose the sign. In a description that line is a comparison, such as `> 50% of cells`.
// A `+` and a year would become list items in the same way, and a stray code fence would turn
// the remainder of the description into a code block. An escape keeps each of them as text.
const keepLiteralLineStart = (line: string): string =>
  line
    .replace(LITERAL_LINE_START, start => start.replaceAll(/./g, String.raw`\$&`))
    .replace(LARGE_NUMBER_MARKER, String.raw`$1\$2`)

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
  // The indentation of the first item of the current list. After a blank line, four spaces of
  // indentation start a code block, so no line keeps its own. An item that continues a list
  // keeps only what it has beyond the first item, which is what nests it.
  let listIndent = 0
  return lines
    .map((line, index) => {
      const continuesList = isListItem(line) && isListItem(lines[index - 1])
      if (!continuesList) listIndent = indentOf(line)
      const unindented = line.slice(Math.min(listIndent, indentOf(line)))
      const repaired = repairBold(keepLiteralLineStart(unindented))
      if (index === lines.length - 1) return repaired
      return isListItem(line) && isListItem(lines[index + 1]) ? `${repaired}\n` : `${repaired}\n\n`
    })
    .join('')
}
