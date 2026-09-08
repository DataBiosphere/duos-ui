import React from 'react'
import TableIconButton from 'src/components/TableIconButton'
import { Styles, Theme } from 'src/libs/theme'
import { Block, Delete } from '@mui/icons-material'
import SimpleButton from 'src/components/SimpleButton'
import { useNavigate } from 'react-router'
import { includes, toLower } from 'src/utils/NodashUtil'
import { DarCollectionSummary } from 'src/types/model'
import 'src/components/dar_collection_table/dar_collection_table.css'

const duosBlue = '#0948B7'
const cancelGray = '#333F52'

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER
const baseCancelButtonStyle: React.CSSProperties = {
  ...Styles.TABLE.TABLE_ICON_BUTTON,
  color: cancelGray,
  alignItems: 'center',
  marginRight: '4px',
  height: '2rem',
  minHeight: '2rem',
  fontSize: '1.8rem',
  boxSizing: 'border-box',
}

const hoverPrimaryButtonStyle = {
  backgroundColor: 'rgb(38 138 204)',
  color: 'white',
}

// Compact sizing so every action button fits on a single line within the DataGrid row's
// fixed height, rather than the larger size used when these rendered in the old SimpleTable.
// Height is pinned explicitly rather than left to padding/line-height: these buttons inherit
// `line-height` from ancestors (via the app's global `button { line-height: inherit }` rule),
// which was inflating their rendered height beyond what padding alone could control. Pinning
// `height`/`lineHeight` directly guarantees the button is only slightly taller than its text,
// regardless of what line-height it would otherwise inherit.
const compactButtonSize: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  marginRight: 4,
  height: '2rem',
  lineHeight: '2rem',
  padding: '0 10px',
  boxSizing: 'border-box',
}

export interface ActionsProps {
  showConfirmationModal: (collection: DarCollectionSummary, action: string) => void
  collection: DarCollectionSummary
  goToVote?: (collectionId: number) => void
  consoleType: string
  actions?: string[]
  status?: string
}

export default function Actions({ showConfirmationModal, collection, goToVote, consoleType, actions = [], status }: Readonly<ActionsProps>) {
  // Draft collections have no darCollectionId; widen locally to allow null fallback
  const collectionId: number | null = collection.darCollectionId
  const uniqueId = collectionId ?? collection.referenceIds[0]
  const navigate = useNavigate()

  const openButtonAttributes = {
    keyProp: `${consoleType}-open-${uniqueId}`,
    label: includes(['complete', 'canceled'], toLower(status ?? '')) ? 'Re-Open' : 'Open',
    onClick: () => showConfirmationModal(collection, 'open'),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white',
    },
    additionalStyle: {
      ...compactButtonSize,
      color: 'white',
    },
  }

  const cancelButtonAttributes = {
    keyProp: `${consoleType}-cancel-${uniqueId}`,
    onClick: () => showConfirmationModal(collection, 'cancel'),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    dataTip: `Cancel ${consoleType === 'researcher' ? 'Collection' : 'Elections'}`,
    icon: Block,
  }

  const voteButtonAttributes = {
    keyProp: `${consoleType}-vote-${uniqueId}`,
    label: 'Vote',
    onClick: () => goToVote?.(collectionId),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white',
    },
    additionalStyle: {
      ...compactButtonSize,
      color: 'white',
      border: `1px ${duosBlue} solid`,
    },
  }

  const updateButtonAttributes = {
    keyProp: `${consoleType}-update-${collectionId}`,
    label: 'Update',
    onClick: () => goToVote?.(collectionId),
    baseColor: 'white',
    hoverStyle: {
      backgroundColor: 'white',
      color: duosBlue,
    },
    additionalStyle: {
      ...compactButtonSize,
      color: duosBlue,
      border: `1px ${duosBlue} solid`,
    },
  }

  const reviewButtonAttributes = {
    keyProp: `${consoleType}-review-${uniqueId}`,
    label: 'Review',
    onClick: () => navigate(`/dar_application_review/${collectionId}`),
    baseColor: 'white',
    fontColor: Theme.palette.secondary,
    hoverStyle: {
      backgroundColor: Theme.palette.secondary,
      color: 'white',
    },
    additionalStyle: {
      ...compactButtonSize,
      border: `1px solid ${Theme.palette.secondary}`,
    },
  }

  const reviewCloseoutButtonAttributes = {
    keyProp: `${consoleType}-review-closeout-${uniqueId}`,
    label: 'Review Closeout',
    onClick: () => navigate(`/dar_application_review/${collectionId}`),
    baseColor: 'white',
    fontColor: Theme.palette.secondary,
    hoverStyle: {
      backgroundColor: Theme.palette.secondary,
      color: 'white',
    },
    additionalStyle: {
      ...compactButtonSize,
      border: `1px solid ${Theme.palette.secondary}`,
    },
  }

  const deleteButtonAttributes = {
    keyProp: `${consoleType}-delete-${uniqueId}`,
    label: 'Delete',
    onClick: () => showConfirmationModal(collection, 'delete'),
    dataTip: 'Delete Collection Draft',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Delete,
  }

  const resumeButtonAttributes = {
    keyProp: `${consoleType}-resume-${uniqueId}`,
    onClick: () => navigate(`/dar_application/${uniqueId}`),
    label: 'Resume',
    baseColor: Theme.palette.secondary,
    fontColor: 'white',
    hoverStyle: hoverPrimaryButtonStyle,
    additionalStyle: {
      ...compactButtonSize,
      border: `1px solid ${Theme.palette.secondary}`,
    },
  }

  const reviseButtonAttributes = {
    keyProp: `${consoleType}-revise-${uniqueId}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: compactButtonSize,
    hoverStyle: hoverPrimaryButtonStyle,
    onClick: () => showConfirmationModal(collection, 'revise'),
  }

  const approveButtonAttributes = {
    keyProp: `${consoleType}-approve-${uniqueId}`,
    label: 'Approve',
    onClick: () => showConfirmationModal(collection, 'approve'),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white',
    },
    additionalStyle: {
      ...compactButtonSize,
      color: 'white',
    },
  }

  const createProgressReportButtonAttributes = {
    keyProp: `${consoleType}-create-progress-report-${uniqueId}`,
    onClick: () => { navigate(`/progress_report_application/${uniqueId}`) },
    label: 'Update',
    baseColor: 'white',
    fontColor: Theme.palette.secondary,
    hoverStyle: {
      backgroundColor: Theme.palette.secondary,
      color: 'white',
    },
    additionalStyle: {
      ...compactButtonSize,
      border: `1px solid ${Theme.palette.secondary}`,
    },
  }

  return (
    <div
      className={`${consoleType}-actions dar-actions-container`}
      key={`${consoleType}-actions-${collectionId}`}
      id={`${consoleType}-actions-${collectionId}`}
      style={{
        display: 'flex',
        padding: '4px 6px',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      {actions.includes('Open') && <SimpleButton {...openButtonAttributes} />}
      {actions.includes('Approve') && <SimpleButton {...approveButtonAttributes} />}
      {actions.includes('Vote') && <SimpleButton {...voteButtonAttributes} />}
      {actions.includes('Update') && <SimpleButton {...updateButtonAttributes} />}
      {actions.includes('Revise') && <SimpleButton {...reviseButtonAttributes} />}
      {actions.includes('Resume') && <SimpleButton {...resumeButtonAttributes} />}
      {actions.includes('Review') && <SimpleButton {...reviewButtonAttributes} />}
      {actions.includes('Delete') && <TableIconButton {...deleteButtonAttributes} />}
      {actions.includes('Cancel') && <TableIconButton {...cancelButtonAttributes} />}
      {actions.includes('Create_Progress_Report') && <SimpleButton {...createProgressReportButtonAttributes} />}
      {actions.includes('Review_Progress_Report') && <SimpleButton {...reviewCloseoutButtonAttributes} />}
    </div>
  )
}
