import React, {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeleteIcon,
  FilePresent as FileIcon,
  Refresh as RetryIcon,
} from '@mui/icons-material'
import { deleteDocument, EntityType, FileCategory, listDocuments, uploadDocument } from 'src/libs/ajax/FileStorageObject'
import type { ResponseError } from 'src/types/model'

export type UploadStatus = 'uploading' | 'uploaded' | 'error'
export type UploadErrorType = 'permission' | 'validation' | 'unknown'

export interface QueueEntry {
  id: string
  file: File
  typeId: FileCategory
  status: UploadStatus
  progress: number
  fsoId?: number
  errorType?: UploadErrorType
}

export interface DeferredFileRef {
  id: string
  file: File
  category: FileCategory
}

interface DocumentUploadApi {
  uploadDocument: typeof uploadDocument
  deleteDocument: typeof deleteDocument
  listDocuments: typeof listDocuments
}

export interface Props {
  entity: EntityType
  entityId: string
  mode?: 'immediate' | 'deferred'
  onFilesReady?: (files: DeferredFileRef[]) => void
  api?: DocumentUploadApi
}

interface DocumentTypeOption {
  id: FileCategory
  label: string
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  { id: FileCategory.IRB_COLLABORATION_LETTER, label: 'IRB Collaboration Letter' },
  { id: FileCategory.DATA_USE_LETTER, label: 'Data Use Letter' },
  { id: FileCategory.ALTERNATIVE_DATA_SHARING_PLAN, label: 'Alternative Data Sharing Plan' },
  { id: FileCategory.NIH_INSTITUTIONAL_CERTIFICATION, label: 'NIH Institutional Certification' },
  { id: FileCategory.DATA_ACCESS_AGREEMENT, label: 'Data Access Agreement (DAA)' },
]

const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx'
const MAX_FILE_SIZE_MB = 25
const PROGRESS_INTERVAL_MS = 180
const MAX_SIMULATED_PROGRESS = 92

const defaultDocumentUploadApi: DocumentUploadApi = {
  uploadDocument: (...args: Parameters<typeof uploadDocument>) => {
    return uploadDocument(...args)
  },
  deleteDocument: (...args: Parameters<typeof deleteDocument>) => {
    return deleteDocument(...args)
  },
  listDocuments: (...args: Parameters<typeof listDocuments>) => {
    return listDocuments(...args)
  },
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getDocumentTypeLabel = (typeId: FileCategory): string => {
  return DOCUMENT_TYPES.find(type => type.id === typeId)?.label ?? typeId
}

const createLocalId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `document-upload-${Date.now()}-${Math.round(Math.random() * 100000)}`
}

const toDeferredFiles = (docs: QueueEntry[]): DeferredFileRef[] => {
  return docs.map(doc => ({
    id: doc.id,
    file: doc.file,
    category: doc.typeId,
  }))
}

const mapUploadError = (error: unknown): UploadErrorType => {
  const status = (error as ResponseError)?.response?.status
  if (status === 403) {
    return 'permission'
  }
  if (status === 400) {
    return 'validation'
  }
  return 'unknown'
}

const getStatusText = (doc: QueueEntry): string => {
  if (doc.status === 'uploading') {
    return `Uploading… ${Math.round(doc.progress)}%`
  }
  if (doc.status === 'uploaded') {
    return 'Uploaded'
  }
  return 'Upload failed'
}

const getErrorMessage = (errorType?: UploadErrorType): string => {
  if (errorType === 'permission') {
    return 'You do not have permission to upload this document.'
  }
  if (errorType === 'validation') {
    return 'The document was rejected by the server validation rules.'
  }
  return 'Something went wrong while uploading this document.'
}

const advanceUploadingProgress = (
  doc: QueueEntry,
  id: string,
): QueueEntry => {
  if (doc.id !== id || doc.status !== 'uploading') {
    return doc
  }

  const nextProgress = Math.min(
    doc.progress + 7 + Math.random() * 13,
    MAX_SIMULATED_PROGRESS,
  )

  return {
    ...doc,
    progress: nextProgress,
  }
}

const advanceProgressForTick = (currentDocs: QueueEntry[], id: string): QueueEntry[] => {
  return currentDocs.map(doc => advanceUploadingProgress(doc, id))
}

export const DocumentUpload = ({
  entity,
  entityId,
  mode = 'immediate',
  onFilesReady,
  api = defaultDocumentUploadApi,
}: Props): React.JSX.Element => {
  const [selectedType, setSelectedType] = useState<FileCategory | null>(null)
  const [docs, setDocs] = useState<QueueEntry[]>([])
  const [isDragActive, setIsDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressTimersRef = useRef<Record<string, ReturnType<typeof globalThis.setInterval>>>({})

  const selectedTypeLabel = useMemo(() => {
    return selectedType ? getDocumentTypeLabel(selectedType) : null
  }, [selectedType])

  const clearProgressTimer = useCallback((id: string): void => {
    const timerId = progressTimersRef.current[id]
    if (timerId) {
      globalThis.clearInterval(timerId)
      delete progressTimersRef.current[id]
    }
  }, [])

  useEffect(() => {
    const timers = progressTimersRef.current
    return () => {
      Object.keys(timers).forEach(clearProgressTimer)
    }
  }, [clearProgressTimer])

  // Load existing documents on mount
  useEffect(() => {
    if (mode !== 'immediate') {
      return
    }

    const loadDocuments = async (): Promise<void> => {
      try {
        const existingDocs = await api.listDocuments(entity, entityId)
        const mapped = existingDocs.map<QueueEntry>(doc => ({
          id: createLocalId(),
          file: new File([], doc.fileName || 'document'),
          typeId: doc.category as FileCategory,
          status: 'uploaded',
          progress: 100,
          fsoId: doc.fileStorageObjectId,
        }))
        setDocs(mapped)
      }
      catch (error) {
        // Log error but don't block UI
        console.error('Failed to load documents:', error)
      }
    }

    void loadDocuments()
  }, [api, entity, entityId, mode])

  // Clear queued documents when changing selected type
  useEffect(() => {
    setDocs([])
  }, [selectedType])

  const startProgressSimulation = useCallback((id: string): void => {
    clearProgressTimer(id)
    progressTimersRef.current[id] = globalThis.setInterval(() => {
      setDocs(currentDocs => advanceProgressForTick(currentDocs, id))
    }, PROGRESS_INTERVAL_MS)
  }, [clearProgressTimer])

  const uploadFile = useCallback(async (entry: QueueEntry): Promise<void> => {
    startProgressSimulation(entry.id)

    try {
      const uploadedDocument = await api.uploadDocument(entity, entityId, entry.file, entry.typeId)
      clearProgressTimer(entry.id)
      setDocs((currentDocs) => {
        return currentDocs.map((doc) => {
          if (doc.id !== entry.id) {
            return doc
          }
          return {
            ...doc,
            status: 'uploaded',
            progress: 100,
            fsoId: uploadedDocument.fileStorageObjectId,
            errorType: undefined,
          }
        })
      })
    }
    catch (error) {
      clearProgressTimer(entry.id)
      setDocs((currentDocs) => {
        return currentDocs.map((doc) => {
          if (doc.id !== entry.id) {
            return doc
          }
          return {
            ...doc,
            status: 'error',
            progress: 0,
            errorType: mapUploadError(error),
          }
        })
      })
    }
  }, [api, clearProgressTimer, entity, entityId, startProgressSimulation])

  const addFiles = useCallback((fileList: FileList): void => {
    if (!selectedType) {
      return
    }

    const newDocs = Array.from(fileList).map<QueueEntry>(file => ({
      id: createLocalId(),
      file,
      typeId: selectedType,
      status: mode === 'deferred' ? 'uploaded' : 'uploading',
      progress: mode === 'deferred' ? 100 : 0,
    }))

    setDocs((currentDocs) => {
      const nextDocs = [...currentDocs, ...newDocs]
      if (mode === 'deferred') {
        onFilesReady?.(toDeferredFiles(nextDocs))
      }
      return nextDocs
    })

    if (mode === 'immediate') {
      newDocs.forEach((doc) => {
        void uploadFile(doc)
      })
    }
  }, [mode, onFilesReady, selectedType, uploadFile])

  const handleFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    if (event.target.files?.length) {
      addFiles(event.target.files)
    }
    event.target.value = ''
  }, [addFiles])

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragActive(false)
    if (!selectedType) {
      return
    }
    if (event.dataTransfer.files?.length) {
      addFiles(event.dataTransfer.files)
    }
  }, [addFiles, selectedType])

  const handleRemove = useCallback(async (id: string): Promise<void> => {
    const docToRemove = docs.find(doc => doc.id === id)
    if (!docToRemove) {
      return
    }

    clearProgressTimer(id)

    if (mode === 'immediate' && docToRemove.fsoId !== undefined) {
      try {
        await api.deleteDocument(entity, entityId, docToRemove.fsoId)
      }
      catch {
        return
      }
    }

    setDocs((currentDocs) => {
      const nextDocs = currentDocs.filter(doc => doc.id !== id)
      if (mode === 'deferred') {
        onFilesReady?.(toDeferredFiles(nextDocs))
      }
      return nextDocs
    })
  }, [api, clearProgressTimer, docs, entity, entityId, mode, onFilesReady])

  const handleRetry = useCallback((id: string): void => {
    if (mode !== 'immediate') {
      return
    }

    const docToRetry = docs.find(doc => doc.id === id)
    if (!docToRetry) {
      return
    }

    const resetEntry: QueueEntry = {
      ...docToRetry,
      status: 'uploading',
      progress: 0,
      errorType: undefined,
      fsoId: undefined,
    }

    setDocs((currentDocs) => {
      return currentDocs.map(doc => doc.id === id ? resetEntry : doc)
    })
    void uploadFile(resetEntry)
  }, [docs, mode, uploadFile])

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {/* Step 1: Select Document Type */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1.5px solid',
                borderColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {selectedType ? '✓' : '1'}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Select document type
            </Typography>
            {selectedTypeLabel && (
              <Typography
                variant="caption"
                sx={{ ml: 'auto', color: 'text.secondary', fontWeight: 500 }}
                data-cy="document-upload-selected-type"
              >
                {selectedTypeLabel}
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }} data-cy="document-upload-type-list">
            {DOCUMENT_TYPES.map(type => (
              <Chip
                key={type.id}
                label={type.label}
                onClick={() => setSelectedType(type.id)}
                variant={selectedType === type.id ? 'filled' : 'outlined'}
                color={selectedType === type.id ? 'primary' : 'default'}
                data-cy={`document-upload-type-${type.id}`}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ height: 1, bgcolor: 'divider' }} />

        {/* Step 2: Drop or Browse Files */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1.5px solid',
                borderColor: 'text.disabled',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: 'text.disabled',
              }}
            >
              2
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Drop or browse files
            </Typography>
          </Box>

          {selectedType
            ? (
                <Paper
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragActive(true)
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    'p': 4,
                    'textAlign': 'center',
                    'cursor': 'pointer',
                    'border': '2px dashed',
                    'borderColor': isDragActive ? 'primary.main' : 'divider',
                    'bgcolor': isDragActive ? 'action.hover' : 'background.paper',
                    'transition': 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                    },
                  }}
                  data-cy="document-upload-dropzone"
                >
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Drop files to upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    or <Box component="span" sx={{ textDecoration: 'underline', color: 'primary.main', fontWeight: 500 }}>browse to add</Box>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PDF, DOCX, DOC — max {MAX_FILE_SIZE_MB} MB each
                  </Typography>
                </Paper>
              )
            : (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'not-allowed',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Select a document type above to enable upload
                  </Typography>
                </Paper>
              )}
        </Box>
      </Paper>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        style={{ display: 'none' }}
        data-cy="document-upload-input"
        onChange={handleFileInputChange}
      />

      {/* Uploaded Queue */}
      {docs.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Uploaded
            </Typography>
            <Chip
              label={docs.length}
              size="small"
              variant="outlined"
              sx={{ minWidth: 24 }}
              data-cy="document-upload-count"
            />
          </Box>

          <Stack spacing={2} data-cy="document-upload-queue">
            {docs.map((doc) => {
              const canRetry = mode === 'immediate' && doc.status === 'error'
              const canDelete = doc.status !== 'uploading'

              return (
                <Card
                  key={doc.id}
                  sx={{
                    border: '1px solid',
                    borderColor: doc.status === 'error' ? 'error.main' : 'divider',
                  }}
                  data-cy="document-upload-card"
                >
                  {doc.status === 'uploading' && (
                    <LinearProgress
                      variant="determinate"
                      value={doc.progress}
                      sx={{ height: 3 }}
                      data-cy="document-upload-progress"
                    />
                  )}

                  <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <FileIcon sx={{ mt: 0.5, color: 'action.disabled' }} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, wordBreak: 'break-word' }}
                      >
                        {doc.file.name}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                        data-cy="document-upload-status"
                      >
                        {getStatusText(doc)} · {formatBytes(doc.file.size)}
                      </Typography>

                      <Chip
                        label={getDocumentTypeLabel(doc.typeId)}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />

                      {doc.status === 'error' && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ display: 'block', mt: 1 }}
                          data-cy="document-upload-error"
                        >
                          {getErrorMessage(doc.errorType)}
                        </Typography>
                      )}
                    </Box>

                    <Stack direction="row" spacing={1}>
                      {canRetry && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RetryIcon />}
                          onClick={() => handleRetry(doc.id)}
                          data-cy="document-upload-retry"
                        >
                          Retry
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => {
                          void handleRemove(doc.id)
                        }}
                        disabled={!canDelete}
                        sx={{ minWidth: 40 }}
                        data-cy="document-upload-delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )
            })}
          </Stack>
        </Box>
      )}
    </Box>
  )
}
