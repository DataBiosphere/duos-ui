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
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  DeleteOutline as DeleteIcon,
  FilePresent as FileIcon,
  InfoOutlined as DetailsIcon,
  OpenInNew as OpenInNewIcon,
  Refresh as RetryIcon,
} from '@mui/icons-material'
import {
  deleteDocument,
  EntityType,
  FileCategory,
  getDocument,
  getDocumentFile,
  listDocuments,
  updateDocumentCategory,
  uploadDocument,
  type FileStorageObject as StoredDocument,
} from 'src/libs/ajax/FileStorageObject'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { Notifications } from 'src/libs/utils'
import type { ResponseError } from 'src/types/model'
import { fileDownload } from 'src/utils/FileDownload'
import { extractError } from 'src/utils/ErrorUtils'

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
  deleted?: boolean
}

export interface FileRef {
  id: string
  file: File
  category: FileCategory
}

interface DocumentUploadApi {
  uploadDocument: typeof uploadDocument
  deleteDocument: typeof deleteDocument
  listDocuments: typeof listDocuments
  updateDocumentCategory?: typeof updateDocumentCategory
  getDocument?: typeof getDocument
  getDocumentFile?: typeof getDocumentFile
}

type DeletedDocumentsView = 'active' | 'all'

export interface Props {
  entity: EntityType
  entityId: string
  isLiveUpload?: boolean
  onFilesReady?: (files: FileRef[]) => void
  categories?: FileCategory[]
  readOnly?: boolean
  api?: DocumentUploadApi
  deletedDocumentsView?: DeletedDocumentsView
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
let localIdCounter = 0

const defaultDocumentUploadApi: DocumentUploadApi = {
  uploadDocument: (...args: Parameters<typeof uploadDocument>) => uploadDocument(...args),
  deleteDocument: (...args: Parameters<typeof deleteDocument>) => deleteDocument(...args),
  listDocuments: (...args: Parameters<typeof listDocuments>) => listDocuments(...args),
  updateDocumentCategory: (...args: Parameters<typeof updateDocumentCategory>) => updateDocumentCategory(...args),
  getDocument: (...args: Parameters<typeof getDocument>) => getDocument(...args),
  getDocumentFile: (...args: Parameters<typeof getDocumentFile>) => getDocumentFile(...args),
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

const getCryptoObject = (): Crypto | undefined => {
  if (typeof globalThis === 'undefined') {
    return undefined
  }
  return globalThis.crypto
}

const getSecureRandomInt = (maxExclusive: number): number => {
  const cryptoObject = getCryptoObject()
  if (cryptoObject?.getRandomValues) {
    const randomBuffer = new Uint32Array(1)
    cryptoObject.getRandomValues(randomBuffer)
    return randomBuffer[0] % maxExclusive
  }

  // Deterministic fallback when crypto is unavailable.
  localIdCounter = (localIdCounter + 1) % maxExclusive
  return localIdCounter
}

const createLocalId = (): string => {
  const cryptoObject = getCryptoObject()
  if (cryptoObject?.randomUUID) {
    return cryptoObject.randomUUID()
  }

  localIdCounter += 1
  return `document-upload-${Date.now()}-${localIdCounter}`
}

const toDeferredFiles = (docs: QueueEntry[]): FileRef[] => {
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
  if (doc.deleted) {
    return 'Deleted'
  }
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
    return 'No permission'
  }
  if (errorType === 'validation') {
    return 'Invalid document type'
  }
  return 'Upload failed'
}

const advanceUploadingProgress = (doc: QueueEntry, id: string): QueueEntry => {
  if (doc.id !== id || doc.status !== 'uploading') {
    return doc
  }

  const nextProgress = Math.min(doc.progress + 7 + getSecureRandomInt(14), MAX_SIMULATED_PROGRESS)
  return { ...doc, progress: nextProgress }
}

const advanceProgressForTick = (currentDocs: QueueEntry[], id: string): QueueEntry[] => {
  return currentDocs.map(doc => advanceUploadingProgress(doc, id))
}

const formatTimestamp = (timestamp?: number): string => {
  if (!timestamp) {
    return 'N/A'
  }
  return new Date(timestamp).toLocaleString()
}

const showUploadError = (message: string, error: unknown): void => {
  Notifications.showError({ text: `${message}: ${extractError(error)}` })
}

const runAsyncSafely = (operation: Promise<unknown>): void => {
  operation.catch(() => undefined)
}

const isPreviewableDocument = (file: Blob | File): boolean => {
  return file.type === 'application/pdf'
}

const openPreviewWindow = (file: Blob | File, fileName: string): void => {
  const objectUrl = globalThis.URL.createObjectURL(file)
  const previewWindow = globalThis.open('', '_blank', 'noopener,noreferrer')

  if (!previewWindow) {
    fileDownload(file, fileName, file.type)
    globalThis.URL.revokeObjectURL(objectUrl)
    return
  }

  previewWindow.document.title = fileName
  previewWindow.document.body.style.margin = '0'
  previewWindow.document.body.innerHTML = `<iframe title="${fileName}" src="${objectUrl}" style="border:0;width:100vw;height:100vh;"></iframe>`
  globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(objectUrl), 60000)
}

const useInitialDocumentsLoad = ({
  api,
  entity,
  entityId,
  isLiveUpload,
  setDocs,
}: {
  api: DocumentUploadApi
  entity: EntityType
  entityId: string
  isLiveUpload: boolean
  setDocs: React.Dispatch<React.SetStateAction<QueueEntry[]>>
}): void => {
  useEffect(() => {
    if (!isLiveUpload) {
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
          deleted: Boolean(doc.deleted || doc.deleteDate),
        }))
        setDocs(mapped)
      }
      catch (error) {
        showUploadError('Unable to load documents', error)
      }
    }

    runAsyncSafely(loadDocuments())
  }, [api, entity, entityId, isLiveUpload, setDocs])
}

const useToggleDetailsHandler = ({
  api,
  detailsById,
  entity,
  entityId,
  isLiveUpload,
  setExpandedDetails,
  setLoadingDetailsById,
  setDetailsById,
}: {
  api: DocumentUploadApi
  detailsById: Record<string, StoredDocument | undefined>
  entity: EntityType
  entityId: string
  isLiveUpload: boolean
  setExpandedDetails: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setLoadingDetailsById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  setDetailsById: React.Dispatch<React.SetStateAction<Record<string, StoredDocument | undefined>>>
}) => useCallback(async (doc: QueueEntry): Promise<void> => {
  setExpandedDetails(current => ({ ...current, [doc.id]: !current[doc.id] }))
  if (detailsById[doc.id] || doc.fsoId === undefined || !isLiveUpload) {
    return
  }
  const fetchDocumentDetails = api.getDocument ?? getDocument
  setLoadingDetailsById(current => ({ ...current, [doc.id]: true }))
  try {
    const details = await fetchDocumentDetails(entity, entityId, doc.fsoId)
    setDetailsById(current => ({ ...current, [doc.id]: details }))
  }
  catch (error) {
    showUploadError('Unable to load document details', error)
  }
  finally {
    setLoadingDetailsById(current => ({ ...current, [doc.id]: false }))
  }
}, [api.getDocument, detailsById, entity, entityId, isLiveUpload, setDetailsById, setExpandedDetails, setLoadingDetailsById])

interface DocumentQueueCardProps {
  doc: QueueEntry
  readOnly: boolean
  isLiveUpload: boolean
  allowedCategories: FileCategory[]
  updatingCategory: boolean
  isDetailsExpanded: boolean
  isLoadingDetails: boolean
  details?: StoredDocument
  onRetry: (id: string) => void
  onView: (doc: QueueEntry) => Promise<void>
  onToggleDetails: (doc: QueueEntry) => Promise<void>
  onRemoveRequest: (doc: QueueEntry) => void
  onCategoryChange: (docId: string, nextCategory: FileCategory) => Promise<void>
}

interface DocumentQueueSectionProps {
  visibleDocs: QueueEntry[]
  readOnly: boolean
  hasDeletedDocs: boolean
  showDeleted: boolean
  onToggleShowDeleted: () => void
  isLiveUpload: boolean
  allowedCategories: FileCategory[]
  updatingCategoryById: Record<string, boolean>
  expandedDetails: Record<string, boolean>
  loadingDetailsById: Record<string, boolean>
  detailsById: Record<string, StoredDocument | undefined>
  onRetry: (id: string) => void
  onView: (doc: QueueEntry) => Promise<void>
  onToggleDetails: (doc: QueueEntry) => Promise<void>
  onRemoveRequest: (doc: QueueEntry) => void
  onCategoryChange: (docId: string, nextCategory: FileCategory) => Promise<void>
}

interface DocumentDetailsSectionProps {
  isLoadingDetails: boolean
  details?: StoredDocument
  isLiveUpload: boolean
}

const DocumentDetailsSection = ({
  isLoadingDetails,
  details,
  isLiveUpload,
}: DocumentDetailsSectionProps): React.JSX.Element => {
  if (isLoadingDetails) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
      >
        Loading details...
      </Typography>
    )
  }

  if (details) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', whiteSpace: 'pre-line' }}
      >
        {`Document ID: ${details.fileStorageObjectId}\nCreated: ${formatTimestamp(details.createDate)}\nUpdated: ${formatTimestamp(details.updateDate)}\nDeleted: ${formatTimestamp(details.deleteDate)}`}
      </Typography>
    )
  }

  if (!isLiveUpload) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
      >
        Details are available after upload.
      </Typography>
    )
  }

  return <></>
}

const DocumentQueueCard = ({
  doc,
  readOnly,
  isLiveUpload,
  allowedCategories,
  updatingCategory,
  isDetailsExpanded,
  isLoadingDetails,
  details,
  onRetry,
  onView,
  onToggleDetails,
  onRemoveRequest,
  onCategoryChange,
}: DocumentQueueCardProps): React.JSX.Element => {
  const canRetry = !readOnly && isLiveUpload && doc.status === 'error'
  const canView = doc.status !== 'uploading' && !doc.deleted
  const canDelete = !readOnly && doc.status !== 'uploading' && !doc.deleted

  return (
    <Card key={doc.id} sx={{ border: '1px solid', borderColor: doc.status === 'error' ? 'error.main' : 'divider' }} data-cy="document-upload-card">
      {doc.status === 'uploading' && (
        <LinearProgress variant="determinate" value={doc.progress} sx={{ height: 3 }} data-cy="document-upload-progress" />
      )}

      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <FileIcon sx={{ mt: 0.5, color: 'action.disabled' }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {doc.file.name}
            {doc.deleted && <Chip label="Deleted" size="small" color="warning" variant="outlined" sx={{ ml: 1 }} data-cy="document-upload-deleted-status" />}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} data-cy="document-upload-status">
            {getStatusText(doc)} · {formatBytes(doc.file.size)}
          </Typography>
          <Select
            size="small"
            value={doc.typeId}
            onChange={(event) => {
              runAsyncSafely(onCategoryChange(doc.id, event.target.value as FileCategory))
            }}
            disabled={readOnly || doc.status === 'uploading' || doc.deleted || updatingCategory}
            sx={{
              'mt': 1,
              'minWidth': 260,
              'fontSize': '1.2rem',
              '& .MuiSelect-select': {
                fontSize: '1.2rem',
                py: 1,
              },
              '& .MuiSvgIcon-root': {
                fontSize: '1.2rem',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  '& .MuiMenuItem-root': {
                    fontSize: '0.875rem',
                  },
                },
              },
            }}
            data-cy="document-upload-category-select"
          >
            {DOCUMENT_TYPES.filter(type => allowedCategories.includes(type.id)).map(type => (
              <MenuItem key={`${doc.id}-${type.id}`} value={type.id}>{type.label}</MenuItem>
            ))}
          </Select>
          {doc.status === 'error' && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }} data-cy="document-upload-error">
              {getErrorMessage(doc.errorType)}
            </Typography>
          )}
          {isDetailsExpanded && (
            <Box
              sx={{ mt: 1.5 }}
              data-cy="document-upload-details"
            >
              <DocumentDetailsSection
                isLoadingDetails={isLoadingDetails}
                details={details}
                isLiveUpload={isLiveUpload}
              />
            </Box>
          )}
        </Box>

        <Stack
          direction="row"
          spacing={1}
        >
          {canRetry && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<RetryIcon />}
              onClick={() => onRetry(doc.id)}
              data-cy="document-upload-retry"
            >
              Retry
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            onClick={() => {
              runAsyncSafely(onView(doc))
            }}
            disabled={!canView}
            data-cy="document-upload-view"
          >
            View
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DetailsIcon />}
            onClick={() => {
              runAsyncSafely(onToggleDetails(doc))
            }}
            disabled={!canView}
            data-cy="document-upload-details-toggle"
          >
            Details
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => {
              onRemoveRequest(doc)
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
}

const DocumentQueueSection = ({
  visibleDocs,
  readOnly,
  hasDeletedDocs,
  showDeleted,
  onToggleShowDeleted,
  isLiveUpload,
  allowedCategories,
  updatingCategoryById,
  expandedDetails,
  loadingDetailsById,
  detailsById,
  onRetry,
  onView,
  onToggleDetails,
  onRemoveRequest,
  onCategoryChange,
}: DocumentQueueSectionProps): React.JSX.Element | null => {
  if (visibleDocs.length === 0 && !hasDeletedDocs) {
    return readOnly
      ? <Typography variant="body2" color="text.secondary" data-cy="document-upload-empty-readonly">No uploaded documents</Typography>
      : null
  }

  return (
    <Box sx={{ mt: readOnly ? 0 : 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Uploaded</Typography>
        <Chip label={visibleDocs.length} size="small" variant="outlined" sx={{ minWidth: 24 }} data-cy="document-upload-count" />
        {hasDeletedDocs && (
          <Button
            size="small"
            variant="text"
            sx={{ ml: 'auto' }}
            onClick={onToggleShowDeleted}
            data-cy="document-upload-toggle-deleted"
          >
            {showDeleted ? 'Hide deleted' : 'Show deleted'}
          </Button>
        )}
      </Box>

      <Stack spacing={2} data-cy="document-upload-queue">
        {visibleDocs.map(doc => (
          <DocumentQueueCard
            key={doc.id}
            doc={doc}
            readOnly={readOnly}
            isLiveUpload={isLiveUpload}
            allowedCategories={allowedCategories}
            updatingCategory={Boolean(updatingCategoryById[doc.id])}
            isDetailsExpanded={Boolean(expandedDetails[doc.id])}
            isLoadingDetails={Boolean(loadingDetailsById[doc.id])}
            details={detailsById[doc.id]}
            onRetry={onRetry}
            onView={onView}
            onToggleDetails={onToggleDetails}
            onRemoveRequest={onRemoveRequest}
            onCategoryChange={onCategoryChange}
          />
        ))}
      </Stack>

      {visibleDocs.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }} data-cy="document-upload-empty-state">
          No uploaded documents
        </Typography>
      )}
    </Box>
  )
}

export const DocumentUpload = ({
  entity,
  entityId,
  isLiveUpload,
  onFilesReady,
  categories,
  readOnly = false,
  api = defaultDocumentUploadApi,
  deletedDocumentsView = 'active',
}: Props): React.JSX.Element => {
  const liveUpload = isLiveUpload ?? true
  const [selectedType, setSelectedType] = useState<FileCategory | null>(null)
  const [docs, setDocs] = useState<QueueEntry[]>([])
  const [isDragActive, setIsDragActive] = useState<boolean>(false)
  const [showDeleted, setShowDeleted] = useState<boolean>(deletedDocumentsView === 'all')
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({})
  const [detailsById, setDetailsById] = useState<Record<string, StoredDocument | undefined>>({})
  const [loadingDetailsById, setLoadingDetailsById] = useState<Record<string, boolean>>({})
  const [updatingCategoryById, setUpdatingCategoryById] = useState<Record<string, boolean>>({})
  const [docPendingDeletion, setDocPendingDeletion] = useState<QueueEntry | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileDialogGuardRef = useRef<boolean>(false)
  const suppressFilePickerRef = useRef<boolean>(false)
  const progressTimersRef = useRef<Record<string, ReturnType<typeof globalThis.setInterval>>>({})
  const lastUploadedSnapshotRef = useRef<string>('')

  const allowedCategories = useMemo((): FileCategory[] => {
    if (categories?.length) {
      return [...new Set(categories)]
    }
    return DOCUMENT_TYPES.map(({ id }) => id)
  }, [categories])

  useEffect(() => {
    if (allowedCategories.length === 1) {
      setSelectedType(allowedCategories[0])
      return
    }

    setSelectedType(current => current && allowedCategories.includes(current) ? current : null)
  }, [allowedCategories])

  useEffect(() => {
    setShowDeleted(deletedDocumentsView === 'all')
  }, [deletedDocumentsView])

  const selectedCategory = selectedType
  const showTypeSelection = allowedCategories.length > 1

  const selectedTypeLabel = useMemo(() => {
    return selectedCategory ? getDocumentTypeLabel(selectedCategory) : null
  }, [selectedCategory])

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
      Object.keys(timers).forEach((timerId) => {
        clearProgressTimer(timerId)
      })
    }
  }, [clearProgressTimer])

  useInitialDocumentsLoad({
    api,
    entity,
    entityId,
    isLiveUpload: liveUpload,
    setDocs,
  })

  useEffect(() => {
    const uploadedDocs = docs.filter(doc => doc.status === 'uploaded' && !doc.deleted)
    const snapshot = uploadedDocs.map(doc => `${doc.id}:${doc.fsoId ?? 'local'}`).join('|')

    if (snapshot === lastUploadedSnapshotRef.current) {
      return
    }

    lastUploadedSnapshotRef.current = snapshot
    const uploadedFiles = toDeferredFiles(uploadedDocs)

    onFilesReady?.(uploadedFiles)
  }, [docs, onFilesReady])

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
      setDocs(currentDocs => currentDocs.map(doc => doc.id === entry.id
        ? {
            ...doc,
            status: 'uploaded',
            progress: 100,
            fsoId: uploadedDocument.fileStorageObjectId,
            errorType: undefined,
          }
        : doc))
    }
    catch (error) {
      clearProgressTimer(entry.id)
      setDocs(currentDocs => currentDocs.map(doc => doc.id === entry.id
        ? {
            ...doc,
            status: 'error',
            progress: 0,
            errorType: mapUploadError(error),
          }
        : doc))
      showUploadError(`Unable to upload ${entry.file.name}`, error)
    }
  }, [api, clearProgressTimer, entity, entityId, startProgressSimulation])

  const addFiles = useCallback((fileList: FileList): void => {
    if (!selectedCategory || readOnly) {
      return
    }

    const newDocs = Array.from(fileList).map<QueueEntry>(file => ({
      id: createLocalId(),
      file,
      typeId: selectedCategory,
      status: liveUpload ? 'uploading' : 'uploaded',
      progress: liveUpload ? 0 : 100,
    }))

    setDocs(currentDocs => [...currentDocs, ...newDocs])

    if (liveUpload) {
      newDocs.forEach((doc) => {
        runAsyncSafely(uploadFile(doc))
      })
    }
  }, [liveUpload, readOnly, selectedCategory, uploadFile])

  const handleFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files
    if (files?.length) {
      addFiles(files)
    }
    event.target.value = ''
  }, [addFiles])

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault()
    setIsDragActive(false)
    if (readOnly || !selectedCategory) {
      return
    }
    const files = event.dataTransfer.files
    if (files?.length) {
      addFiles(files)
    }
  }, [addFiles, readOnly, selectedCategory])

  const handleTypeSelectionAreaClick = useCallback((event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation()
  }, [])

  const suppressFilePickerFromSelection = useCallback((): void => {
    suppressFilePickerRef.current = true
    globalThis.setTimeout(() => {
      suppressFilePickerRef.current = false
    }, 0)
  }, [])

  const triggerFilePicker = useCallback((): void => {
    if (readOnly || fileDialogGuardRef.current || suppressFilePickerRef.current) {
      return
    }

    fileDialogGuardRef.current = true
    fileInputRef.current?.click()
    fileInputRef.current?.blur() // Prevent focus-based re-trigger
    globalThis.setTimeout(() => {
      fileDialogGuardRef.current = false
    }, 300)
  }, [readOnly])

  const handleDropzoneClick = useCallback((event: React.MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation()
    event.preventDefault()
    triggerFilePicker()
  }, [triggerFilePicker])

  const handleDropzoneKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    triggerFilePicker()
  }, [triggerFilePicker])

  const handleRemove = useCallback(async (id: string): Promise<void> => {
    if (readOnly) {
      return
    }

    const docToRemove = docs.find(doc => doc.id === id)
    if (!docToRemove) {
      return
    }

    clearProgressTimer(id)

    if (liveUpload && docToRemove.fsoId !== undefined) {
      try {
        await api.deleteDocument(entity, entityId, docToRemove.fsoId)
      }
      catch (error) {
        showUploadError('Unable to delete document', error)
        return
      }
      setDocs(currentDocs => currentDocs.map(doc => doc.id === id ? { ...doc, deleted: true } : doc))
      return
    }

    setDocs(currentDocs => currentDocs.filter(doc => doc.id !== id))
  }, [api, clearProgressTimer, docs, entity, entityId, liveUpload, readOnly])

  const handleRemoveRequest = useCallback((doc: QueueEntry): void => {
    setDocPendingDeletion(doc)
  }, [])

  const handleCloseDeleteConfirmation = useCallback((): void => {
    setDocPendingDeletion(null)
  }, [])

  const handleConfirmDelete = useCallback((): void => {
    const pendingDocId = docPendingDeletion?.id
    setDocPendingDeletion(null)
    if (!pendingDocId) {
      return
    }
    runAsyncSafely(handleRemove(pendingDocId))
  }, [docPendingDeletion, handleRemove])

  const handleRetry = useCallback((id: string): void => {
    if (!liveUpload || readOnly) {
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

    setDocs(currentDocs => currentDocs.map(doc => doc.id === id ? resetEntry : doc))
    runAsyncSafely(uploadFile(resetEntry))
  }, [docs, liveUpload, readOnly, uploadFile])

  const handleViewDocument = useCallback(async (doc: QueueEntry): Promise<void> => {
    try {
      let fileToOpen: Blob | File
      if (liveUpload && doc.fsoId !== undefined) {
        const fetchDocumentFile = api.getDocumentFile ?? getDocumentFile
        const blob = await fetchDocumentFile(entity, entityId, doc.fsoId)
        fileToOpen = new File([blob], doc.file.name, {
          type: blob.type || doc.file.type || 'application/octet-stream',
        })
      }
      else {
        fileToOpen = doc.file
      }

      if (isPreviewableDocument(fileToOpen)) {
        openPreviewWindow(fileToOpen, doc.file.name)
        return
      }

      fileDownload(fileToOpen, doc.file.name, fileToOpen.type)
    }
    catch (error) {
      showUploadError('Unable to view document', error)
    }
  }, [api.getDocumentFile, entity, entityId, liveUpload])

  const handleToggleDetails = useToggleDetailsHandler({
    api,
    detailsById,
    entity,
    entityId,
    isLiveUpload: liveUpload,
    setExpandedDetails,
    setLoadingDetailsById,
    setDetailsById,
  })

  const handleCategoryChange = useCallback(async (docId: string, nextCategory: FileCategory): Promise<void> => {
    const currentDoc = docs.find(doc => doc.id === docId)
    if (!currentDoc || currentDoc.typeId === nextCategory) {
      return
    }

    setDocs(currentDocs => currentDocs.map(doc => doc.id === docId ? { ...doc, typeId: nextCategory } : doc))
    if (!liveUpload || currentDoc.fsoId === undefined) {
      return
    }

    const updateDocument = api.updateDocumentCategory ?? updateDocumentCategory
    setUpdatingCategoryById(current => ({ ...current, [docId]: true }))
    try {
      await updateDocument(entity, entityId, currentDoc.fsoId, nextCategory)
    }
    catch (error) {
      setDocs(currentDocs => currentDocs.map(doc => doc.id === docId ? { ...doc, typeId: currentDoc.typeId } : doc))
      showUploadError('Unable to update document category', error)
    }
    finally {
      setUpdatingCategoryById(current => ({ ...current, [docId]: false }))
    }
  }, [api.updateDocumentCategory, docs, entity, entityId, liveUpload])

  const visibleDocs = useMemo(() => {
    if (showDeleted) {
      return docs
    }
    return docs.filter(doc => !doc.deleted)
  }, [docs, showDeleted])

  const hasDeletedDocs = useMemo(() => docs.some(doc => doc.deleted), [docs])

  const queueSection = (
    <DocumentQueueSection
      visibleDocs={visibleDocs}
      readOnly={readOnly}
      hasDeletedDocs={hasDeletedDocs}
      showDeleted={showDeleted}
      onToggleShowDeleted={() => setShowDeleted(current => !current)}
      isLiveUpload={liveUpload}
      allowedCategories={allowedCategories}
      updatingCategoryById={updatingCategoryById}
      expandedDetails={expandedDetails}
      loadingDetailsById={loadingDetailsById}
      detailsById={detailsById}
      onRetry={handleRetry}
      onView={handleViewDocument}
      onToggleDetails={handleToggleDetails}
      onRemoveRequest={handleRemoveRequest}
      onCategoryChange={handleCategoryChange}
    />
  )

  if (readOnly) {
    return <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }} data-cy="document-upload-root">{queueSection}</Box>
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }} data-cy="document-upload-root">
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{ p: 3 }}
          data-cy="document-upload-type-section"
          onMouseDownCapture={suppressFilePickerFromSelection}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
            onClick={handleTypeSelectionAreaClick}
          >
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
              {selectedCategory ? '✓' : '1'}
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Select document type</Typography>
            {selectedTypeLabel && (
              <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary', fontWeight: 500 }} data-cy="document-upload-selected-type">
                {selectedTypeLabel}
              </Typography>
            )}
          </Box>

          {showTypeSelection
            ? (
                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ gap: 1 }}
                  data-cy="document-upload-type-list"
                  onClick={handleTypeSelectionAreaClick}
                >
                  {DOCUMENT_TYPES.filter(type => allowedCategories.includes(type.id)).map(type => (
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
              )
            : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  data-cy="document-upload-fixed-category"
                  onClick={handleTypeSelectionAreaClick}
                >
                  {selectedCategory ? getDocumentTypeLabel(selectedCategory) : 'Document'}
                </Typography>
              )}
        </Box>

        <Box sx={{ height: 1, bgcolor: 'divider' }} />

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
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Drop or browse files</Typography>
          </Box>

          {selectedCategory
            ? (
                <Paper
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragActive(true)
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={handleDrop}
                  sx={{
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
                  <Box
                    role="button"
                    tabIndex={0}
                    onClick={handleDropzoneClick}
                    onKeyDown={handleDropzoneKeyDown}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    data-cy="document-upload-dropzone-trigger"
                  >
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" sx={{ mb: 0.5 }}>Drop files to upload</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      or <Box component="span" sx={{ textDecoration: 'underline', color: 'primary.main', fontWeight: 500 }}>browse to add</Box>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">PDF, DOCX, DOC — max {MAX_FILE_SIZE_MB} MB each</Typography>
                  </Box>
                </Paper>
              )
            : (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', cursor: 'not-allowed' }}>
                  <Typography variant="body2" color="text.secondary">Select a document type above to enable upload</Typography>
                </Paper>
              )}
        </Box>
      </Paper>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        multiple
        disabled={readOnly}
        style={{ display: 'none' }}
        data-cy="document-upload-input"
        onChange={handleFileInputChange}
      />

      <ConfirmationDialog
        title="Delete File"
        openState={docPendingDeletion !== null}
        close={handleCloseDeleteConfirmation}
        action={handleConfirmDelete}
        description={`Are you sure you want to delete the file '${docPendingDeletion?.file.name ?? ''}'?`}
      />

      {queueSection}
    </Box>
  )
}
