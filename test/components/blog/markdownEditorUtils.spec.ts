import { describe, expect, it } from 'vitest'
import {
  altTextFromFileName,
  applyToolbarAction,
  EditorState,
  insertBlock,
  TABLE_TEMPLATE,
} from 'src/components/blog/markdownEditorUtils'

const at = (value: string, selectionStart: number, selectionEnd = selectionStart): EditorState => ({ value, selectionStart, selectionEnd })

const selectedText = (state: EditorState) => state.value.slice(state.selectionStart, state.selectionEnd)

describe('markdownEditorUtils', () => {
  it('wraps the selection in bold markers and keeps the text selected', () => {
    const result = applyToolbarAction(at('make this bold', 10, 14), 'bold')
    expect(result.value).toBe('make this **bold**')
    expect(selectedText(result)).toBe('bold')
  })

  it('inserts and selects a placeholder when nothing is selected', () => {
    const result = applyToolbarAction(at('', 0), 'italic')
    expect(result.value).toBe('_italic text_')
    expect(selectedText(result)).toBe('italic text')
  })

  it('selects the URL placeholder of a new link', () => {
    const result = applyToolbarAction(at('see docs', 4, 8), 'link')
    expect(result.value).toBe('see [docs](https://)')
    expect(selectedText(result)).toBe('https://')
  })

  it('numbers every selected line', () => {
    const result = applyToolbarAction(at('one\ntwo\nthree', 0, 13), 'numberedList')
    expect(result.value).toBe('1. one\n2. two\n3. three')
  })

  it('prefixes the whole current line for a heading even with the cursor mid-line', () => {
    const result = applyToolbarAction(at('intro\ntitle here\nrest', 9), 'heading2')
    expect(result.value).toBe('intro\n## title here\nrest')
  })

  it('uses a fenced block for multi-line code and inline code otherwise', () => {
    expect(applyToolbarAction(at('a\nb', 0, 3), 'code').value).toBe('```\na\nb\n```')
    expect(applyToolbarAction(at('x', 0, 1), 'code').value).toBe('`x`')
  })

  it('separates an inserted block from surrounding text with blank lines', () => {
    const result = insertBlock(at('before after', 6), '---')
    expect(result.value).toBe('before\n\n---\n\n after')
    expect(result.selectionStart).toBe('before\n\n---\n\n'.length)
  })

  it('does not add extra blank lines where they already exist', () => {
    expect(insertBlock(at('para\n\n', 6), '---').value).toBe('para\n\n---\n\n')
    expect(insertBlock(at('', 0), TABLE_TEMPLATE).value).toBe(`${TABLE_TEMPLATE}\n\n`)
  })

  it('derives alt text from a file name', () => {
    expect(altTextFromFileName('team [photo].final.png')).toBe('team photo.final')
    expect(altTextFromFileName('.png')).toBe('image')
  })
})
