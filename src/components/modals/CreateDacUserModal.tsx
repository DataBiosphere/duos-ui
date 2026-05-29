import React, { useState } from 'react'
import { Styles, Theme } from 'src/libs/theme'
import CloseIconComponent from 'src/components/CloseIconComponent'
import ModalWrapper from 'src/components/collaborator_list/ModalWrapper'
import SimpleButton from 'src/components/SimpleButton'
import { FormField, FormValidators } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { Alert } from 'src/components/Alert'
import { Spinner } from 'src/components/Spinner'
import { User } from 'src/libs/ajax/User'
import type { DuosUser, UserRole } from 'src/types/model'

const researcherRole = { roleId: 5, name: 'Researcher' as const } as UserRole

interface Validation {
  name?: ValidationError
  email?: ValidationError
}

interface FieldChange {
  key: string
  value: string
}

interface CreateDacUserModalProps {
  showModal: boolean
  targetRole: 'chair' | 'member'
  // null = Admin (no domain restriction); string[] = allowed domains for Chair
  allowedDomains: string[] | null
  onUserCreated: (user: DuosUser, role: 'chair' | 'member') => void
  onCloseRequest: () => void
}

export const CreateDacUserModal: React.FC<CreateDacUserModalProps> = (props) => {
  const { showModal, targetRole, allowedDomains, onUserCreated, onCloseRequest } = props

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [validation, setValidation] = useState<Validation>({})
  const [hasValidated, setHasValidated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [duplicateEmail, setDuplicateEmail] = useState(false)
  const [domainError, setDomainError] = useState(false)

  const isEmailDomainAllowed = (emailValue: string): boolean => {
    if (allowedDomains === null) return true
    const domain = emailValue.split('@')[1]?.toLowerCase() ?? ''
    return allowedDomains.some(d => d.toLowerCase() === domain)
  }

  const makeError = (id: string): ValidationError => ({ valid: false, failed: [id] })

  const calcErrors = (n: string, e: string): Validation => {
    const v: Validation = {}
    if (!n.trim()) v.name = makeError('required')
    if (!e.trim()) {
      v.email = makeError('required')
    }
    else if (!FormValidators.EMAIL.isValid(e)) {
      v.email = makeError('email')
    }
    return v
  }

  const hasErrors = (v: Validation): boolean => Object.values(v).some(err => !!err)

  const handleChange = ({ key, value }: FieldChange): void => {
    const updatedName = key === 'name' ? value : name
    const updatedEmail = key === 'email' ? value : email
    if (key === 'name') setName(value)
    if (key === 'email') {
      setEmail(value)
      setDuplicateEmail(false)
      setDomainError(false)
    }
    if (hasValidated) {
      setValidation(calcErrors(updatedName, updatedEmail))
    }
  }

  const submitHandler = async (): Promise<void> => {
    setHasValidated(true)
    setDuplicateEmail(false)
    setDomainError(false)

    const errors = calcErrors(name, email)
    setValidation(errors)
    if (hasErrors(errors)) return

    if (!isEmailDomainAllowed(email)) {
      setDomainError(true)
      return
    }

    setIsLoading(true)
    try {
      const createdUser = await User.create({
        displayName: name,
        email,
        emailPreference: true,
        roles: [researcherRole],
      })

      if (!createdUser) {
        setDuplicateEmail(true)
        return
      }

      onUserCreated(createdUser, targetRole)
    }
    finally {
      setIsLoading(false)
    }
  }

  const isConfirmDisabled = (): boolean => {
    if (isLoading) return true
    if (!hasValidated) return !name.trim() || !email.trim()
    return hasErrors(validation)
  }

  const roleLabel = targetRole === 'chair' ? 'Chairperson' : 'Member'

  return (
    <ModalWrapper
      isOpen={showModal}
      onRequestClose={onCloseRequest}
      shouldCloseOnOverlayClick={true}
      style={{
        content: { ...Styles.MODAL.CONTENT, maxHeight: '550px' },
        overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      }}
    >
      <div style={Styles.MODAL.CONTENT}>
        <CloseIconComponent closeFn={onCloseRequest} />
        <div style={Styles.MODAL.TITLE_HEADER}>
          Create New User
        </div>
        <div style={{ borderBottom: '1px solid #E8ECEF', marginBottom: '1rem' }} />
        <p style={{ marginBottom: '1rem' }}>
          Create a new DUOS user and add them as a <strong>{roleLabel}</strong>.
        </p>
        <div>
          <FormField
            id="name"
            title="Name"
            defaultValue={name}
            placeholder="User name"
            validators={[FormValidators.REQUIRED]}
            onChange={handleChange}
            validation={validation.name}
          />
        </div>
        <div>
          <FormField
            id="email"
            title="Email Address"
            defaultValue={email}
            placeholder={allowedDomains?.[0] ? `e.g. username@${allowedDomains[0]}` : 'e.g. username@broadinstitute.org'}
            validators={[FormValidators.REQUIRED, FormValidators.EMAIL]}
            onChange={handleChange}
            validation={validation.email}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '2rem' }}>
          {isLoading && <Spinner />}
          <SimpleButton
            onClick={() => { void submitHandler() }}
            additionalStyle={{ margin: '0', width: '80px', height: '15px', padding: '20px' }}
            baseColor={Theme.palette.secondary}
            disabled={isConfirmDisabled()}
            label="Create"
          />
          <SimpleButton
            onClick={onCloseRequest}
            additionalStyle={{ marginLeft: '1%', width: '80px', height: '15px', padding: '20px' }}
            baseColor={Theme.palette.secondary}
            label="Cancel"
          />
        </div>

        {domainError && (
          <Alert
            id="domainError"
            type="danger"
            title="Invalid email domain"
            description={`Email must belong to one of your institution's domains: ${(allowedDomains ?? []).join(', ') || 'none configured'}`}
          />
        )}
        {duplicateEmail && (
          <Alert
            id="duplicateEmail"
            type="danger"
            title="Conflicts to resolve!"
            description="There is a user already registered with this email account."
          />
        )}
      </div>
    </ModalWrapper>
  )
}
