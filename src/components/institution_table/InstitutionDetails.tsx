import React, { useEffect, useState } from 'react'
import { Institution } from 'src/types/model'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Link, useHistory } from 'react-router-dom'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { Button, TextField } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { AxiosError } from 'axios'
import { Notifications } from 'src/libs/utils'
import { Spinner } from 'src/components/Spinner'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'
import { InstitutionDomainEditor } from 'src/components/institution_table/components/InstitutionDomainEditor'
import { SigningOfficialsList } from 'src/components/institution_table/components/SigningOfficialsList'
import { FORM_MODES, InstitutionFormMode } from 'src/components/institution_table/InstitutionFormMode'

interface InstitutionDetailsProps {
  match: {
    params: {
      institutionId?: number
    }
  }
  formMode: InstitutionFormMode
}

interface InstitutionDetailsUpdate {
  name: string
  domains: string[]
}

export const InstitutionDetails = (props: InstitutionDetailsProps) => {
  const { institutionId } = props.match.params
  const formMode = props.formMode
  const history = useHistory()
  const [institutionList, setInstitutionList] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(formMode === FORM_MODES.createNew)
  const [institution, setInstitution] = useState<Institution>()
  const [institutionUpdates, setInstitutionUpdates] = useState<InstitutionDetailsUpdate>({
    name: '',
    domains: [],
  })
  const [nameError, setNameError] = useState<string>('')

  useEffect(() => {
    const loadInstitution = async () => {
      try {
        const institutions: Institution[] = await InstitutionAPI.list()
        setInstitutionList(institutions)
        if (institutionId && formMode === FORM_MODES.editExisting) {
          const institution = institutions.find(inst => inst.id.toString() === institutionId.toString())
          setInstitution(institution)
        }
        else {
          setLoading(false)
          setIsEditing(true)
        }
      }
      catch (error) {
        Notifications.showError({
          text: `Failed to load institution details: ${extractError(error)}'}`,
        })
      }
      finally {
        setLoading(false)
      }
    }
    loadInstitution()
  }, [formMode, institutionId])

  const normalizeInstitutionName = (name: string): string => {
    // Trim whitespace from start and end
    let normalized = name.trim()

    // Replace curly single quotes with straight single quotes
    normalized = normalized.replace(/[‘’]/g, '\'')

    return normalized
  }

  const validateInstitutionName = (name: string): string => {
    const normalizedName = normalizeInstitutionName(name)

    if (normalizedName.length === 0) {
      return 'Institution name is required'
    }

    // Check for double quotes (straight or curly)
    if (/[“"”]/.test(name)) {
      return 'Institution name cannot contain double quotation marks (")'
    }

    // Check if name already exists (excluding current institution in edit mode)
    const existingInstitution = institutionList.find(inst =>
      inst.name.toLowerCase() === normalizedName.toLowerCase()
      && inst.id !== institution?.id,
    )

    if (existingInstitution) {
      return 'An institution with this name already exists'
    }

    return ''
  }

  const updateInstitution = async (updatedInstitution: InstitutionDetailsUpdate) => {
    try {
      setSaving(true)
      const resp = await InstitutionAPI.patchInstitution(institutionId, updatedInstitution)
      // NB: we need to preserve signing officials in state on update since they're not returned by the patch endpoint
      setInstitution((prevInstitution) => {
        if (!prevInstitution) return resp
        return {
          ...resp,
          signingOfficials: prevInstitution.signingOfficials || [],
        }
      })
      Notifications.showSuccess({ text: 'Institution updated successfully' })
    }
    catch (error) {
      const axiosError = error as AxiosError
      const consentError = extractConsentError(axiosError)
      if (consentError && consentError.code === 409) {
        Notifications.showError({
          text: 'One or more of the domains specified is already used by another institution. A domain can only be associated with one institution.',
        })
      }
      else {
        Notifications.showError({
          text: `An error occurred when trying to update the institution: ${consentError ? consentError.message : 'no additional error available'}`,
        })
      }
    }
    finally {
      setSaving(false)
    }
  }

  const createNewInstitution = async (newInstitution: InstitutionDetailsUpdate) => {
    try {
      setSaving(true)
      const resp = await InstitutionAPI.postInstitution(newInstitution)
      setInstitution(resp)
      Notifications.showSuccess({ text: 'Institution created successfully' })
      setIsEditing(false)
      history.push(`/admin_manage_institutions/institutions/${resp.id}`)
    }
    catch (error) {
      const axiosError = error as AxiosError
      const consentError = extractConsentError(axiosError)
      if (consentError && consentError.code === 409) {
        Notifications.showError({
          text: 'One or more of the domains specified is already used by another institution. A domain can only be associated with one institution.',
        })
      }
      else {
        Notifications.showError({
          text: `An error occurred when trying to create the institution: ${consentError ? consentError.message : 'no additional error available'}`,
        })
      }
    }
    finally {
      setSaving(false)
    }
  }

  const enterEditMode = () => {
    setInstitutionUpdates({
      name: institution?.name || '',
      domains: institution?.domains ? [...institution.domains] : [],
    })
    setNameError('') // Clear any previous name errors
    setIsEditing(true)
  }

  const saveChanges = async () => {
    if (institutionUpdates) {
      setSaving(true)

      // Ensure name is normalized before saving
      const normalizedUpdates = {
        ...institutionUpdates,
        name: normalizeInstitutionName(institutionUpdates.name),
      }

      switch (formMode) {
        case FORM_MODES.createNew:
          await createNewInstitution(normalizedUpdates)
          break
        case FORM_MODES.editExisting:
          await updateInstitution(normalizedUpdates)
          break
        default:
          Notifications.showError({ text: 'An unexpected error occurred: unrecognized form mode' })
          break
      }
      setSaving(false)
      setIsEditing(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      saveChanges()
    }
    else {
      enterEditMode()
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNameError('') // Clear any name errors
    setInstitutionUpdates({
      name: institution?.name || '',
      domains: institution?.domains ? [...institution.domains] : [],
    })
  }

  const handleNameChange = (value: string) => {
    if (institutionUpdates) {
      // Don't normalize while typing - let user type freely
      setInstitutionUpdates({ ...institutionUpdates, name: value })

      // Validate using the normalized version but don't change the input value
      const normalizedName = normalizeInstitutionName(value)
      const error = validateInstitutionName(normalizedName)
      setNameError(error)
    }
  }

  const handleDomainsChange = (newDomains: string[]) => {
    if (institutionUpdates) {
      setInstitutionUpdates({ ...institutionUpdates, domains: newDomains })
    }
  }

  const getConfirmButtonText = () => {
    if (isEditing && formMode === FORM_MODES.createNew) {
      return saving ? 'Creating...' : 'Create'
    }
    if (isEditing && formMode === FORM_MODES.editExisting) {
      return saving ? 'Saving...' : 'Save'
    }
    return 'Edit'
  }

  return !loading
    ? (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
        }}
        >
          <div style={{ paddingLeft: 40 }}>
            <Link
              id="link_institutions"
              to="/admin_manage_institutions"
              className="navbar-brand"
              style={{ height: 28, width: 28, paddingTop: '0.67rem' }}
            >
              <img id="back-arrow-icon" src={backArrowIcon} alt="Back" style={{ height: 28, width: 28 }} />
            </Link>
          </div>
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', width: '100%', paddingRight: 40, paddingBottom: 40 }}>
            <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Back to institutions</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {saving && <Spinner />}
                {isEditing && !saving && formMode === FORM_MODES.editExisting && (
                  <Button
                    size="large"
                    variant="outlined"
                    color="error"
                    onClick={handleCancelEdit}
                    style={{ marginRight: '10px', fontSize: 14 }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  size="large"
                  variant="contained"
                  color="primary"
                  onClick={handleEditToggle}
                  style={{ fontSize: 14 }}
                  startIcon={!isEditing && <EditIcon />}
                  disabled={saving || (isEditing && (!institutionUpdates || institutionUpdates.name.trim().length === 0 || nameError.length > 0))}
                >
                  {getConfirmButtonText()}
                </Button>
              </div>
            </div>
            <div style={{ paddingTop: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: 18 }}>Institution Name</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  variant="outlined"
                  value={isEditing ? institutionUpdates?.name : institution?.name}
                  size="small"
                  placeholder="Institution Name"
                  disabled={!isEditing}
                  error={isEditing && nameError.length > 0}
                  helperText={isEditing && nameError.length > 0 ? nameError : ''}
                  InputProps={{
                    style: { fontSize: 14 },
                  }}
                  FormHelperTextProps={{
                    style: { fontSize: 14 },
                  }}
                  style={{ width: 300 }}
                  onChange={(e) => {
                    handleNameChange(e.target.value)
                  }}
                  onBlur={(e) => {
                    // Normalize the name when user finishes editing
                    if (isEditing && institutionUpdates) {
                      const originalName = e.target.value
                      const normalizedName = normalizeInstitutionName(originalName)

                      // Check if normalization changed the input
                      if (originalName !== normalizedName) {
                        setInstitutionUpdates({ ...institutionUpdates, name: normalizedName })

                        // Show user-friendly message about what was changed
                        const changes = []
                        if (originalName.trim() !== originalName) {
                          changes.push('removed extra spaces')
                        }
                        if (originalName.includes('‘') || originalName.includes('’')) {
                          changes.push('converted curly quotes to straight quotes')
                        }

                        if (changes.length > 0) {
                          const changeMessage = changes.join(' and ')
                          Notifications.showInformation({
                            text: `Institution name has been automatically cleaned up: ${changeMessage}.`,
                          })
                        }
                      }

                      // Re-validate with the normalized name
                      const error = validateInstitutionName(normalizedName)
                      setNameError(error)
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: '#7b7b7b',
                    },
                  }}
                />
              </div>
            </div>

            <InstitutionDomainEditor
              domains={isEditing ? institutionUpdates?.domains || [] : institution?.domains || []}
              isEditing={isEditing}
              onDomainsChange={handleDomainsChange}
              institutionList={institutionList}
            />

            <SigningOfficialsList signingOfficials={institution?.signingOfficials || []} />
          </div>
        </div>
      )
    : <div>Loading...</div>
}
