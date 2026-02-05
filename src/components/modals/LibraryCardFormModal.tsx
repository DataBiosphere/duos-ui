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
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { User } from 'src/libs/ajax/User'
import { CreateDuosUserRequest } from 'src/types/requestTypes'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import ReactMarkdown from 'react-markdown'

interface Validation {
  name?: ValidationError
  email?: ValidationError
}

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
  isNewUser: boolean
  setIsNewUser: (isNew: boolean) => void
  newUser: NewUserInput
  setNewUser: (value: NewUserInput) => void
  validation: Validation
  setValidation: (v: Validation) => void
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
  const {
    selectedUsers,
    dropdownOptions,
    updateUsers,
    isNewUser,
    setIsNewUser,
    newUser,
    setNewUser,
    validation,
    setValidation,
  } = props

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

  const toggleAlternateFormLink = () => {
    if (isNewUser) {
      setNewUser({ name: '', email: '' })
    }
    else {
      updateUsers([])
    }
    setIsNewUser(!isNewUser)
  }

  const makeError = (message: string): ValidationError => ({ valid: false, failed: [message] })

  const calcErrors = (u: NewUserInput): Validation => {
    const v: Validation = {}
    if (!u.name?.trim()) v.name = makeError('required')

    if (!u.email?.trim()) {
      v.email = makeError('required')
    }
    else if (!FormValidators.EMAIL.isValid(u.email)) {
      v.email = makeError('email')
    }
    else if (!FormValidators.EMAILDOMAIN.isValid(u.email)) {
      v.email = makeError('emailDomain')
    }
    return v
  }

  const handleNewUserChange = (change: FormFieldChange) => {
    const updated = { ...newUser, [change.key]: change.value }
    setNewUser(updated)
    setValidation(calcErrors(updated))
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ marginBottom: '2%', width: '100%' }}>
        {!isNewUser
          ? (
              <>
                <p><strong>Select from Existing Users OR <a onClick={toggleAlternateFormLink}>Add New User</a></strong></p>
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
                <p><strong>Add New User OR <a onClick={toggleAlternateFormLink}>Select from Existing Users</a></strong></p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <FormField
                    id="name"
                    title="User Name"
                    hideTitle={true}
                    defaultValue={newUser?.name}
                    placeholder="User Name"
                    validators={[FormValidators.REQUIRED]}
                    onChange={handleNewUserChange}
                    validation={validation.name}
                    style={{ flex: 1, padding: '0.5rem' }}
                  />
                  <FormField
                    id="email"
                    title="User Email"
                    hideTitle={true}
                    defaultValue={newUser?.email}
                    placeholder="User Email"
                    validators={[FormValidators.REQUIRED, FormValidators.EMAIL, FormValidators.EMAILDOMAIN]}
                    onChange={handleNewUserChange}
                    validation={validation.email}
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
  const [isNewUser, setIsNewUser] = useState<boolean>(false)
  const [newUser, setNewUser] = useState<NewUserInput>({ name: '', email: '' })
  const [validation, setValidation] = useState<Validation>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const validationFailed = (v: Validation) => Object.keys(v).length > 0 && Object.values(v).some(e => !!e)

  // Handle confirm button disabled state
  const noSelectedUsers = (): boolean => !isNewUser && selectedUsers.length === 0
  const incompleteValidation = (): boolean => isNewUser && validationFailed(validation)
  const isConfirmDisabled = (): boolean => isLoading || noSelectedUsers() || incompleteValidation()

  console.log('validation:', validation)
  // Create a library card for each selected user
  const createLibraryCards = async () => {
    if (incompleteValidation()) return

    if (noSelectedUsers()) return

    try {
      setIsLoading(true)

      if (isNewUser) {
        try {
          // Create new user
          const researcherRole = { roleId: 5, name: USER_ROLES.researcher }
          const createdUser = await User.create({
            displayName: newUser.name,
            email: newUser.email,
            roles: [researcherRole],
            emailPreference: false,
          } as CreateDuosUserRequest)

          // Add the new user to the selected users list
          if (createdUser) {
            selectedUsers.push({
              userId: createdUser.userId,
              displayName: createdUser.displayName,
              email: createdUser.email,
            })
          }
        }
        catch (error) {
          Notifications.showError({ text: <ReactMarkdown>{extractError(error)}</ReactMarkdown> })
          return
        }
      }

      // Map selected users to library cards
      const cards = selectedUsers.map((user) => {
        return {
          userId: user.userId,
          userEmail: user.email,
          userName: user.displayName,
        } as LibraryCard
      })

      await createOnClick(cards)
      setIsNewUser(false)
      setNewUser({ name: '', email: '' })
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
          isNewUser={isNewUser}
          setIsNewUser={setIsNewUser}
          newUser={newUser}
          setNewUser={setNewUser}
          validation={validation}
          setValidation={setValidation}
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
