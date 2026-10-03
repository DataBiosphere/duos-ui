import React, { useRef, useState } from 'react'
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material'
import { BlogImage } from 'src/types/blog'
import { BLOG_IMAGE_ACCEPT } from 'src/components/blog/markdownEditorUtils'
import { useBlogImageResolver } from 'src/components/blog/useBlogImageResolver'

interface CoverImageFieldProps {
  readonly imageId?: string
  readonly alt?: string
  readonly onImageChange: (imageId: string | undefined) => void
  readonly onAltChange: (alt: string) => void
  readonly onUploadImage: (file: File) => Promise<BlogImage>
  readonly onUploadError: (error: unknown) => void
}

export const CoverImageField = ({ imageId, alt = '', onImageChange, onAltChange, onUploadImage, onUploadError }: CoverImageFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const resolveImage = useBlogImageResolver()
  const imageUrl = imageId ? resolveImage(imageId) : undefined

  const upload = async (file: File | undefined) => {
    if (!file) {
      return
    }
    setUploading(true)
    try {
      const image = await onUploadImage(file)
      onImageChange(image.imageId)
    }
    catch (error) {
      onUploadError(error)
    }
    finally {
      setUploading(false)
    }
  }

  return (
    <Box>
      <Typography sx={{ fontWeight: 600, fontSize: '1.6rem', marginBottom: '0.5rem' }}>Cover image</Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Box
          sx={{ width: 240, aspectRatio: '16 / 9', borderRadius: '4px', border: '1px dashed #c4c4c4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#fafafa' }}
        >
          {uploading && <CircularProgress size={24} aria-label="Uploading cover image" />}
          {!uploading && imageUrl && <img src={imageUrl} alt={alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          {!uploading && !imageUrl && <Typography sx={{ fontSize: '1.2rem', color: '#777' }}>No cover image</Typography>}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 240 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small" disabled={uploading} onClick={() => fileInputRef.current?.click()} sx={{ fontSize: '1.2rem' }}>
              {imageId ? 'Replace image' : 'Upload image'}
            </Button>
            {imageId && (
              <Button variant="text" size="small" color="error" disabled={uploading} onClick={() => onImageChange(undefined)} sx={{ fontSize: '1.2rem' }}>
                Remove
              </Button>
            )}
          </Box>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept={Object.keys(BLOG_IMAGE_ACCEPT).join(',')}
            data-testid="cover-image-input"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              void upload(file)
            }}
          />
          <TextField
            label="Cover image alt text"
            size="small"
            value={alt}
            disabled={!imageId}
            onChange={event => onAltChange(event.target.value)}
            helperText="Describe the image for screen reader users."
          />
        </Box>
      </Box>
    </Box>
  )
}

export default CoverImageField
