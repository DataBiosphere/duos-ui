/** Image types consent accepts for blog uploads (no SVG — it can carry script). */
export const BLOG_IMAGE_ACCEPT = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
}

/** The editor's text and selection, before or after a toolbar edit. */
export interface EditorState {
  value: string
  selectionStart: number
  selectionEnd: number
}

const selected = ({ value, selectionStart, selectionEnd }: EditorState) => value.slice(selectionStart, selectionEnd)

/**
 * Wrap the selection in `before`/`after` (e.g. `**` for bold). With nothing selected, inserts
 * `placeholder` wrapped and selects it so the admin can type over it.
 */
export const wrapSelection = (state: EditorState, before: string, after: string, placeholder: string): EditorState => {
  const text = selected(state) || placeholder
  const value = state.value.slice(0, state.selectionStart) + before + text + after + state.value.slice(state.selectionEnd)
  const selectionStart = state.selectionStart + before.length
  return { value, selectionStart, selectionEnd: selectionStart + text.length }
}

/**
 * Prefix every line the selection touches (e.g. `- ` for a list). `prefix` receives the line's
 * index within the selection, for numbered lists.
 */
export const prefixLines = (state: EditorState, prefix: (index: number) => string): EditorState => {
  const lineStart = state.value.lastIndexOf('\n', state.selectionStart - 1) + 1
  const nextBreak = state.value.indexOf('\n', state.selectionEnd)
  const lineEnd = nextBreak === -1 ? state.value.length : nextBreak
  const lines = state.value.slice(lineStart, lineEnd).split('\n')
  const prefixed = lines.map((line, index) => prefix(index) + line).join('\n')
  const value = state.value.slice(0, lineStart) + prefixed + state.value.slice(lineEnd)
  return { value, selectionStart: lineStart, selectionEnd: lineStart + prefixed.length }
}

/** Newlines to add beside a block so a blank line separates it from the neighbouring text. */
const padding = (hasBlankLine: boolean, hasNewline: boolean): string => {
  if (hasBlankLine) {
    return ''
  }
  return hasNewline ? '\n' : '\n\n'
}

/**
 * Insert a block (table, rule, image, fenced code) at the cursor, replacing any selection, padded
 * with blank lines so Markdown parses it as its own block. The cursor lands after the block.
 */
export const insertBlock = (state: EditorState, block: string): EditorState => {
  const head = state.value.slice(0, state.selectionStart)
  const tail = state.value.slice(state.selectionEnd)
  const leading = head.length === 0 ? '' : padding(head.endsWith('\n\n'), head.endsWith('\n'))
  const trailing = padding(tail.startsWith('\n\n'), tail.startsWith('\n'))
  const value = head + leading + block + trailing + tail
  const cursor = head.length + leading.length + block.length + trailing.length
  return { value, selectionStart: cursor, selectionEnd: cursor }
}

export const TABLE_TEMPLATE = '| Column 1 | Column 2 |\n| --- | --- |\n| Cell | Cell |'

export type ToolbarAction
  = | 'heading2' | 'heading3' | 'bold' | 'italic' | 'strikethrough' | 'link'
    | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'table' | 'rule'

export const applyToolbarAction = (state: EditorState, action: ToolbarAction): EditorState => {
  switch (action) {
    case 'heading2':
      return prefixLines(state, () => '## ')
    case 'heading3':
      return prefixLines(state, () => '### ')
    case 'bold':
      return wrapSelection(state, '**', '**', 'bold text')
    case 'italic':
      return wrapSelection(state, '_', '_', 'italic text')
    case 'strikethrough':
      return wrapSelection(state, '~~', '~~', 'struck text')
    case 'link': {
      // Select the URL placeholder rather than the link text, since that is what still needs typing.
      const text = selected(state) || 'link text'
      const markdown = `[${text}](https://)`
      const value = state.value.slice(0, state.selectionStart) + markdown + state.value.slice(state.selectionEnd)
      const urlStart = state.selectionStart + text.length + 3
      return { value, selectionStart: urlStart, selectionEnd: urlStart + 'https://'.length }
    }
    case 'bulletList':
      return prefixLines(state, () => '- ')
    case 'numberedList':
      return prefixLines(state, index => `${index + 1}. `)
    case 'quote':
      return prefixLines(state, () => '> ')
    case 'code':
      return selected(state).includes('\n')
        ? wrapSelection(state, '```\n', '\n```', '')
        : wrapSelection(state, '`', '`', 'code')
    case 'table':
      return insertBlock(state, TABLE_TEMPLATE)
    case 'rule':
      return insertBlock(state, '---')
  }
}

/** Alt text for an uploaded image: its file name without the extension, minus Markdown brackets. */
export const altTextFromFileName = (fileName: string): string =>
  fileName.replace(/\.[^.]+$/, '').replaceAll(/[[\]]/g, '').trim() || 'image'
