import React, { useState } from 'react'
import { isNil } from 'lodash'
import { Styles, Theme } from 'src/libs/theme'
import CloseIconComponent from 'src/components/CloseIconComponent'
import ModalWrapper from 'src/components/collaborator_list/ModalWrapper'
import AsyncSelect from 'react-select/async'
import SimpleButton from 'src/components/SimpleButton'
import { LibraryCardAgreementTermsDownload } from 'src/components/LibraryCardAgreementTermsDownload'
import { MultiValue } from 'react-select'
import { LibraryCard } from 'src/types/model'
import { Spinner } from 'src/components/Spinner'
import { FormField, FormValidators } from 'src/components/forms/forms'

// This represents the fields describing users in a selection dropdown menu
interface UserOption {
  userId: number
  displayName: string
  email: string
  libraryCard?: LibraryCard
}

interface FormFieldRowProps {
  selectedUsers: UserOption[]
  dropdownOptions: UserOption[]
  updateUsers: (values: MultiValue<UserOption>) => void
}

export interface LibraryCardFormModalProps {
  showModal: boolean
  createOnClick: (cards: LibraryCard[]) => Promise<void>
  closeModal: () => void
  users: UserOption[]
}

interface NewUserInput {
  name: string
  email: string
}

interface FormFieldChange {
  key: string
  value: string
}

const FormFieldRow: React.FC<FormFieldRowProps> = (props) => {
  const { selectedUsers, dropdownOptions, updateUsers } = props
  const [isNewUser, setIsNewUser] = useState<boolean>(false)
  const [newUser, setNewUser] = useState<NewUserInput>({ name: '', email: '' })

  // Represents users that do not already have library cards
  const cardlessUserOptions = dropdownOptions.filter(option => isNil(option.libraryCard))

  // Filter function for auto-completing user dropdown
  const filterUserOptions = (term: string) => {
    return cardlessUserOptions.filter((user) => {
      const filterTarget = (user.displayName + ' ' + user.email).toLowerCase()
      return filterTarget.includes(term.toLowerCase())
    })
  }

  const loadOptions = (inputValue: string, callback: (options: UserOption[]) => void) => {
    setTimeout(() => {
      callback(filterUserOptions(inputValue))
    }, 0)
  }

  // const validationFailed = (v: Validation) => Object.values(v).some(e => !!e)

  const onChangeNewUserInput = ({ key, value }: FormFieldChange) => {
    let updated: NewUserInput = { ...newUser }

    updated = { ...updated, [key]: value }

    setNewUser(updated)
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ marginBottom: '2%', width: '100%' }}>
        {!isNewUser
          ? (
              <>
                <p><strong>Select from Existing Users OR <a onClick={() => { setIsNewUser(true) }}>Add New User</a></strong></p>
                <AsyncSelect
                  classNamePrefix="select"
                  className="select-autocomplete"
                  key="select-user"
                  isClearable={true}
                  isMulti={true}
                  onChange={updateUsers}
                  value={selectedUsers}
                  defaultOptions={cardlessUserOptions}
                  loadOptions={loadOptions}
                  placeholder="Select a DUOS User..."
                  isOptionSelected={() => false} // Workaround to prevent odd react-select behavior where all dropdown options are highlighted
                  /* eslint-disable-next-line no-constant-binary-expression */
                  getOptionLabel={(option: UserOption) => `${option.displayName} (${option.email})` || option.email || ''}
                />
              </>
            )
          : (
              <>
                <p><strong>Add New User OR <a onClick={() => { setIsNewUser(false) }}>Select from Existing Users</a></strong></p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <FormField
                    id="name"
                    title="User Name"
                    hideTitle={true}
                    defaultValue={newUser?.name}
                    placeholder="User Name"
                    validators={[FormValidators.REQUIRED]}
                    onChange={onChangeNewUserInput}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <FormField
                    id="email"
                    title="User Email"
                    hideTitle={true}
                    defaultValue={newUser?.email}
                    placeholder="User Email"
                    validators={[FormValidators.REQUIRED, FormValidators.EMAIL, FormValidators.EMAILDOMAIN]}
                    onChange={onChangeNewUserInput}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                </div>
              </>
            )}
      </div>
    </div>
  )
}

const LibraryCardFormModal = (props: LibraryCardFormModalProps) => {
  const { showModal, createOnClick, closeModal, users } = props
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Create a library card for each selected user
  const createLibraryCards = async () => {
    if (selectedUsers.length === 0) return

    try {
      setIsLoading(true)

      // Map selected users to library cards
      const cards = selectedUsers.map((user) => {
        return {
          userId: user.userId,
          userEmail: user.email,
          userName: user.displayName,
        } as LibraryCard
      })

      await createOnClick(cards)
      setSelectedUsers([])
    }
    finally {
      setIsLoading(false)
    }
  }

  // Handle multi-selection changes
  const updateUsers = (newValues: MultiValue<UserOption>) => {
    setSelectedUsers(newValues as UserOption[])
  }

  // Check if we have any selected users
  const isConfirmDisabled = (): boolean => {
    return selectedUsers.length === 0 || isLoading
  }

  return (
    <ModalWrapper
      isOpen={showModal}
      onRequestClose={closeModal}
      shouldCloseOnOverlayClick={true}
      style={{
        content: { ...Styles.MODAL.CONTENT },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div data-cy="library-card-form-modal" style={Styles.MODAL.CONTENT}>
        <CloseIconComponent closeFn={closeModal} />
        <div style={Styles.MODAL.TITLE_HEADER}>
          Add Library Cards
        </div>
        <div style={{ borderBottom: '1px solid #1FB50' }} />
        {/* LCA Terms Download */}
        <LibraryCardAgreementTermsDownload />
        {/* users dropdown */}
        <FormFieldRow
          selectedUsers={selectedUsers}
          updateUsers={updateUsers}
          dropdownOptions={users}
        />
        <div style={{ display: 'inline-block', marginBottom: '1rem' }}>
          By clicking &#39;ADD&#39; you agree to the terms of the agreements above for all users.
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {isLoading && <Spinner />}
          <SimpleButton
            data-cy="library-card-form-modal-add-button"
            onClick={createLibraryCards}
            additionalStyle={{ margin: '0%', width: '80px', height: '15px', padding: '20px' }}
            baseColor={Theme.palette.secondary}
            disabled={isConfirmDisabled()}
            label="Add"
          />
          <SimpleButton
            data-cy="library-card-form-modal-close-button"
            onClick={closeModal}
            additionalStyle={{ marginLeft: '1%', width: '80px', height: '15px', padding: '20px' }}
            baseColor={Theme.palette.secondary}
            label="Cancel"
          />
        </div>
      </div>
    </ModalWrapper>
  )
}

export default LibraryCardFormModal
