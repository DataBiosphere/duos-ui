import React from 'react'
import { isNil } from 'src/utils/NodashUtil'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { isCollectionCanceled } from 'src/libs/utils'
import { DarCollection, DarCollectionSummary } from 'src/types/model'

export interface CollectionConfirmationModalProps {
  collection: DarCollectionSummary
  showConfirmation: boolean
  setShowConfirmation: (value: boolean) => void
  cancelCollection: (collection: DarCollectionSummary) => Promise<void>
  reviseCollection?: ((collection: DarCollectionSummary) => Promise<void>) | null
  openCollection: (collection: DarCollectionSummary) => Promise<void>
  consoleAction?: string
  deleteDraft: (collection: DarCollectionSummary) => Promise<void>
  approveCollection: (collection: DarCollectionSummary) => Promise<void>
}

export default function CollectionConfirmationModal({ collection, showConfirmation, setShowConfirmation, cancelCollection, reviseCollection, openCollection, consoleAction, deleteDraft, approveCollection }: Readonly<CollectionConfirmationModalProps>) {
  const getModalHeader = (coll: DarCollectionSummary | null) => {
    if (!isNil(coll)) {
      return `${coll.darCode} - ${coll.name}`
    }
    return ''
  }

  const cancelOnClick = async () => {
    await cancelCollection(collection)
    setShowConfirmation(false)
  }

  const reviseOnClick = async () => {
    await reviseCollection?.(collection)
    setShowConfirmation(false)
  }

  const openOnClick = async () => {
    await openCollection(collection)
    setShowConfirmation(false)
  }

  const approveOnClick = async () => {
    await approveCollection(collection)
    setShowConfirmation(false)
  }

  const deleteOnClick = async () => {
    await deleteDraft(collection)
    setShowConfirmation(false)
  }

  const cancelModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Cancel Data Access Request"
      message={`Are you sure you want to cancel ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={cancelOnClick}
    />
  )

  const reviseModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      styleOverride={{ height: '35%' }}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Revise Data Access Request"
      message={`Are you sure you want to revise ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={reviseOnClick}
    />
  )

  const openModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Open Data Access Request"
      message={`Are you sure you want to open ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={openOnClick}
    />
  )

  const approveModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Approve Data Access Request"
      message={`Are you sure you want to approve ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={approveOnClick}
    />
  )

  const deleteModal = (
    <ConfirmationModal
      showConfirmation={showConfirmation}
      styleOverride={{ height: '35%' }}
      closeConfirmation={() => setShowConfirmation(false)}
      title="Delete Data Access Request Draft"
      message={`Are you sure you want to delete ${collection.darCode}?`}
      header={getModalHeader(collection)}
      onConfirm={deleteOnClick}
    />
  )

  switch (consoleAction) {
    case 'revise':
      return reviseModal
    case 'cancel':
      return cancelModal
    case 'open':
      return openModal
    case 'approve':
      return approveModal
    case 'delete':
      return deleteModal
    // conditional used in older references, will remove when implementation is updated
    // Logic for this old assumption is flawed since chairs in different DACs may have different actions enabled for the same collection
    // Updates will occur in later console tickets
    default:
      // isCollectionCanceled expects DarCollection; DarCollectionSummary lacks dars so it safely returns false
      return isCollectionCanceled(collection as unknown as DarCollection) ? reviseModal : cancelModal
  }
}
