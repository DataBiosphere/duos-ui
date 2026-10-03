import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Box,
  Divider,
  IconButton,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material'
import FormatBoldIcon from '@mui/icons-material/FormatBold'
import FormatItalicIcon from '@mui/icons-material/FormatItalic'
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS'
import TitleIcon from '@mui/icons-material/Title'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import InsertLinkIcon from '@mui/icons-material/InsertLink'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import CodeIcon from '@mui/icons-material/Code'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { BlogMarkdown } from 'src/components/blog/BlogMarkdown'
import {
  altTextFromFileName,
  applyToolbarAction,
  BLOG_IMAGE_ACCEPT,
  EditorState,
  insertBlock,
  ToolbarAction,
} from 'src/components/blog/markdownEditorUtils'
import { BlogImage } from 'src/types/blog'
import { toDuosImageUrl } from 'src/utils/BlogUtils'

type EditorView = 'write' | 'preview' | 'split'

interface MarkdownEditorProps {
  readonly id: string
  readonly label: string
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onUploadImage: (file: File) => Promise<BlogImage>
  readonly onUploadError: (error: unknown) => void
  readonly error?: string
}

const TOOLBAR: Array<{ action: ToolbarAction, label: string, icon: React.ReactNode } | 'divider'> = [
  { action: 'heading2', label: 'Heading', icon: <TitleIcon /> },
  { action: 'heading3', label: 'Subheading', icon: <TextFieldsIcon /> },
  'divider',
  { action: 'bold', label: 'Bold', icon: <FormatBoldIcon /> },
  { action: 'italic', label: 'Italic', icon: <FormatItalicIcon /> },
  { action: 'strikethrough', label: 'Strikethrough', icon: <StrikethroughSIcon /> },
  { action: 'link', label: 'Link', icon: <InsertLinkIcon /> },
  'divider',
  { action: 'bulletList', label: 'Bulleted list', icon: <FormatListBulletedIcon /> },
  { action: 'numberedList', label: 'Numbered list', icon: <FormatListNumberedIcon /> },
  { action: 'quote', label: 'Quote', icon: <FormatQuoteIcon /> },
  { action: 'code', label: 'Code', icon: <CodeIcon /> },
  { action: 'table', label: 'Table', icon: <TableChartOutlinedIcon /> },
  { action: 'rule', label: 'Horizontal rule', icon: <HorizontalRuleIcon /> },
]

const TEXTAREA_SX = {
  width: '100%',
  minHeight: '40rem',
  resize: 'vertical' as const,
  border: 0,
  outline: 'none',
  padding: '1.2rem',
  fontFamily: 'monospace',
  fontSize: '1.4rem',
  lineHeight: 1.6,
  backgroundColor: 'transparent',
}

/**
 * Markdown editor with a formatting toolbar, write/preview/split views, and image upload by
 * toolbar button, drag-and-drop or paste. Uploaded images are inserted as `duos-image:` links.
 */
export const MarkdownEditor = ({ id, label, value, onChange, onUploadImage, onUploadError, error }: MarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingSelection = useRef<[number, number] | null>(null)
  // The latest text, so an upload that finishes after further typing inserts into what is there now.
  const latestValue = useRef(value)
  useEffect(() => {
    latestValue.current = value
  }, [value])
  const [view, setView] = useState<EditorView>('split')
  const [uploadCount, setUploadCount] = useState(0)

  // Restore the selection a toolbar edit asked for, once React has written the new value.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (textarea && pendingSelection.current) {
      const [start, end] = pendingSelection.current
      pendingSelection.current = null
      textarea.focus()
      textarea.setSelectionRange(start, end)
    }
  }, [value])

  const currentState = (): EditorState => {
    const textarea = textareaRef.current
    const text = latestValue.current
    return {
      value: text,
      selectionStart: textarea?.selectionStart ?? text.length,
      selectionEnd: textarea?.selectionEnd ?? text.length,
    }
  }

  const commit = (next: EditorState) => {
    pendingSelection.current = [next.selectionStart, next.selectionEnd]
    latestValue.current = next.value
    onChange(next.value)
  }

  const runAction = (action: ToolbarAction) => {
    if (view === 'preview') {
      setView('split')
    }
    commit(applyToolbarAction(currentState(), action))
  }

  const uploadImages = async (files: File[]) => {
    for (const file of files) {
      setUploadCount(count => count + 1)
      try {
        const image = await onUploadImage(file)
        commit(insertBlock(currentState(), `![${altTextFromFileName(file.name)}](${toDuosImageUrl(image.imageId)})`))
      }
      catch (uploadError) {
        onUploadError(uploadError)
      }
      finally {
        setUploadCount(count => count - 1)
      }
    }
  }

  const { getRootProps, isDragActive } = useDropzone({
    accept: BLOG_IMAGE_ACCEPT,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted) => {
      void uploadImages(accepted)
    },
  })

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const images = Array.from(event.clipboardData.files).filter(file => file.type.startsWith('image/'))
    if (images.length > 0) {
      event.preventDefault()
      void uploadImages(images)
    }
  }

  const showWrite = view !== 'preview'
  const showPreview = view !== 'write'

  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ fontWeight: 600, fontSize: '1.6rem', display: 'block', marginBottom: '0.5rem' }}>
        {label}
      </Typography>
      <Box sx={{ border: `1px solid ${error ? '#d32f2f' : '#c4c4c4'}`, borderRadius: '4px', overflow: 'hidden' }}>
        <Box
          role="toolbar"
          aria-label="Formatting"
          sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25, padding: '0.4rem', borderBottom: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}
        >
          {TOOLBAR.map((item, index) =>
            item === 'divider'
              ? <Divider key={`divider-${index}`} orientation="vertical" flexItem sx={{ marginX: 0.5 }} />
              : (
                  <Tooltip key={item.action} title={item.label}>
                    <IconButton size="small" aria-label={item.label} onClick={() => runAction(item.action)}>
                      {item.icon}
                    </IconButton>
                  </Tooltip>
                ))}
          <Tooltip title="Upload image">
            <IconButton size="small" aria-label="Upload image" onClick={() => fileInputRef.current?.click()}>
              <ImageOutlinedIcon />
            </IconButton>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept={Object.keys(BLOG_IMAGE_ACCEPT).join(',')}
            data-testid="markdown-image-input"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              event.target.value = ''
              void uploadImages(files)
            }}
          />
          <ToggleButtonGroup
            value={view}
            exclusive
            size="small"
            aria-label="Editor view"
            onChange={(_event, next: EditorView | null) => next && setView(next)}
            sx={{ 'marginLeft': 'auto', '& .MuiToggleButton-root': { fontSize: '1.2rem', paddingY: 0.25 } }}
          >
            <ToggleButton value="write">Write</ToggleButton>
            <ToggleButton value="split">Split</ToggleButton>
            <ToggleButton value="preview">Preview</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {uploadCount > 0 && <LinearProgress aria-label="Uploading image" />}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: showWrite && showPreview ? '1fr 1fr' : '1fr' } }}>
          {showWrite && (
            <Box {...getRootProps()} sx={{ position: 'relative', borderRight: showPreview ? { md: '1px solid #e0e0e0' } : 0 }}>
              <Box
                component="textarea"
                id={id}
                ref={textareaRef}
                value={value}
                aria-invalid={Boolean(error)}
                aria-describedby={`${id}-help`}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
                onPaste={handlePaste}
                sx={TEXTAREA_SX}
              />
              {isDragActive && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(33, 111, 180, 0.08)', border: '2px dashed #216fb4', fontSize: '1.6rem' }}>
                  Drop images to upload
                </Box>
              )}
            </Box>
          )}
          {showPreview && (
            <Box sx={{ padding: '1.2rem', minHeight: '40rem', maxHeight: '80rem', overflowY: 'auto' }} aria-label="Preview">
              {value.trim().length > 0
                ? <BlogMarkdown markdown={value} />
                : <Typography sx={{ fontSize: '1.4rem', color: '#777' }}>Nothing to preview yet.</Typography>}
            </Box>
          )}
        </Box>
      </Box>
      <Typography id={`${id}-help`} sx={{ fontSize: '1.2rem', marginTop: '0.5rem', color: error ? '#d32f2f' : '#666' }}>
        {error ?? 'Markdown with tables and strikethrough. Drag, paste or upload PNG, JPEG, GIF or WebP images up to 5 MB.'}
      </Typography>
    </Box>
  )
}

export default MarkdownEditor
