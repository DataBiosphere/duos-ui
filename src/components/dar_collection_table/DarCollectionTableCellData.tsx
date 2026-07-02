import React from 'react'
import { includes, isEmpty, isNil, toLower, uniq } from 'src/utils/NodashUtil'
import { formatDate } from 'src/libs/utils'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import Actions from 'src/components/dar_collection_table/Actions'
import DarCollectionAdminReviewLink from 'src/components/dar_collection_table/DarCollectionAdminReviewLink'
import { consoleTypes, styles } from 'src/utils/DarCollectionUtils'
import { Link } from 'react-router-dom'
import { DarCollectionSummary } from 'src/types/model'
import 'src/components/dar_collection_table/dar_collection_table.css'

export interface CellData {
  data: React.ReactNode
  value?: string
  id: number
  style?: React.CSSProperties
  label: string
  isComponent?: boolean
}

interface ProjectTitleCellDataParams {
  name?: string
  darCollectionId: number
  label?: string
}

interface DarCodeCellDataParams {
  darCode?: string
  darCollectionId: number
  collectionIsExpanded: boolean
  updateCollectionIsExpanded: (expanded: boolean) => void
  status: string
  consoleType: string
  label?: string
}

interface DacCellDataParams {
  dacNames: string[]
  darCollectionId: number
  label?: string
}

interface SubmissionDateCellDataParams {
  submissionDate: number | string | null | undefined
  darCollectionId: number
  label?: string
}

interface ResearcherCellDataParams {
  researcherName?: string
  darCollectionId: number
  label?: string
}

interface InstitutionCellDataParams {
  institutionName?: string
  darCollectionId: number
  label?: string
}

interface DatasetCountCellDataParams {
  collection: DarCollectionSummary
  darCollectionId: number
  label?: string
}

interface ExpiresAtCellDataParams {
  collection: DarCollectionSummary
  darCollectionId: number
  label?: string
}

interface StatusCellDataParams {
  status?: string
  darCollectionId: number
  label?: string
}

interface ConsoleActionsCellDataParams {
  collection: DarCollectionSummary
  goToVote?: (collectionId: number) => void
  showConfirmationModal: (collection: DarCollectionSummary, action: string) => void
  consoleType: string
  actions?: string[]
  status?: string
}

// eslint-disable-next-line react-refresh/only-export-components
export function projectTitleCellData({ darCollectionId, name = '- -', label = 'project-title' }: ProjectTitleCellDataParams): CellData {
  return {
    data: isEmpty(name) ? '- -' : name,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.projectTitle,
      paddingRight: '2%',
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function darCodeCellData({ darCollectionId, collectionIsExpanded, updateCollectionIsExpanded, status, consoleType, darCode = '- -', label = 'dar-code' }: DarCodeCellDataParams): CellData {
  let darCodeData: React.ReactNode

  switch (consoleType) {
    case consoleTypes.ADMIN:
      darCodeData = <DarCollectionAdminReviewLink darCollectionId={darCollectionId} darCode={darCode} />
      break
    case consoleTypes.CHAIR:
    case consoleTypes.MEMBER:
    case consoleTypes.SIGNING_OFFICIAL:
      darCodeData = dacLinkToCollection(darCode, darCollectionId, status)
      break
    default:
      darCodeData = darCode
  }

  const ExpandComponent = collectionIsExpanded ? ExpandLess : ExpandMore

  return {
    data: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {toLower(status) !== 'draft' && (
          <ExpandComponent
            id={`${darCollectionId}_dropdown`}
            className={`sort-icon dar-expand-dropdown-arrow ${collectionIsExpanded ? 'sort-icon-up' : 'sort-icon-down'}`}
            onClick={() => {
              updateCollectionIsExpanded(!collectionIsExpanded)
            }}
          />
        )}
        {darCodeData}
      </div>
    ),
    value: darCode,
    id: darCollectionId,
    style: {
      color: styles.color.darCode,
      fontSize: styles.fontSize.darCode,
      fontWeight: '500',
      overflowWrap: 'break-word',
    },
    label,
  }
}

const dacLinkToCollection = (darCode: string, darCollectionId: number, status = '') => {
  const hasOpenElections = includes(toLower(status), 'open')
  const path = hasOpenElections
    ? `/dar_collection/${darCollectionId}`
    : `/dar_vote_review/${darCollectionId}`

  return <Link to={path}>{darCode}</Link>
}

export function DacCellData({ dacNames, darCollectionId, label = 'dacNames' }: DacCellDataParams): CellData {
  const dacString = uniq(dacNames).join('\n')

  return {
    data: dacString,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.dacNames,
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function submissionDateCellData({ submissionDate, darCollectionId, label = 'submission-date' }: SubmissionDateCellDataParams): CellData {
  let dateString: string
  if (isNil(submissionDate) || toLower(submissionDate) === 'unsubmitted') {
    dateString = '- -'
  }
  else {
    dateString = formatDate(submissionDate)
  }
  return {
    data: dateString,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.submissionDate,
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function researcherCellData({ darCollectionId, researcherName = '- -', label = 'researcher' }: ResearcherCellDataParams): CellData {
  return {
    data: researcherName,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.researcher,
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function institutionCellData({ darCollectionId, institutionName = '- -', label = 'institution' }: InstitutionCellDataParams): CellData {
  return {
    data: institutionName,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.institution,
      paddingRight: '1%',
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function datasetCountCellData({ collection, darCollectionId, label = 'datasets' }: DatasetCountCellDataParams): CellData {
  return {
    data: collection.datasetCount || '- -',
    id: darCollectionId,
    style: {
      color: '#333F52',
      fontSize: styles.fontSize.datasetCount,
      fontWeight: 600,
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function expiresAtCellData({ collection, darCollectionId, label = 'expiration-date' }: ExpiresAtCellDataParams): CellData {
  const dateString = isNil(collection.expiresAt) ? '- -' : formatDate(collection.expiresAt)
  return {
    data: dateString,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.submissionDate,
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function statusCellData({ darCollectionId, status = '- -', label = 'status' }: StatusCellDataParams): CellData {
  return {
    data: status,
    id: darCollectionId,
    style: {
      color: '#333F52',
      fontWeight: 600,
      fontSize: styles.fontSize.status,
    },
    label,
  }
}

// eslint-disable-next-line react-refresh/only-export-components
export function consoleActionsCellData({ collection, goToVote, showConfirmationModal, consoleType, actions, status }: ConsoleActionsCellDataParams): CellData {
  const actionComponent = (
    <Actions
      collection={collection}
      consoleType={consoleType}
      showConfirmationModal={showConfirmationModal}
      goToVote={goToVote}
      actions={actions}
      status={status}
    />
  )

  return {
    isComponent: true,
    id: collection.darCollectionId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions,
    },
    label: 'table-actions',
    data: actionComponent,
  }
}

export default {
  projectTitleCellData,
  DacCellData,
  darCodeCellData,
  submissionDateCellData,
  researcherCellData,
  institutionCellData,
  datasetCountCellData,
  expiresAtCellData,
  statusCellData,
  consoleActionsCellData,
}
