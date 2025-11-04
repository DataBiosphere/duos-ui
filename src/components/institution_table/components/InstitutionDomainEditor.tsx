import { Button, Chip, TextField } from '@mui/material'
import React, { useState } from 'react'
import { Institution } from 'src/types/model'

interface DomainEditorProps {
  domains: string[]
  isEditing: boolean
  onDomainsChange?: (domains: string[]) => void
  institutionList: Institution[]
}

export const InstitutionDomainEditor = ({ domains, isEditing, onDomainsChange, institutionList }: DomainEditorProps) => {
  const [tempDomain, setTempDomain] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const domainToInstitutionMap: Record<string, Institution> = {}
  institutionList.forEach((inst: Institution) => {
    (inst.domains || []).forEach((domain) => {
      domainToInstitutionMap[domain] = inst
    })
  })

  const validateDomain = (domain: string): string | null => {
    try {
      // Check if it's a valid FQDN (Fully Qualified Domain Name)
      const fqdnRegex = /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.[A-Za-z]{2,}$/
      const isFQDN = (str: string) => fqdnRegex.test(str)
      if (!isFQDN(domain)) {
        return 'Please enter a valid domain name (e.g., example.com)'
      }

      // Additional checks for domain format
      if (domain.length > 253) {
        return 'Domain name is too long (maximum 253 characters)'
      }

      // Check for valid characters and structure
      const parts = domain.split('.')
      if (parts.length < 2) {
        return 'Domain must have at least one dot (e.g., example.com)'
      }

      // Check each part of the domain
      for (const part of parts) {
        if (part.length === 0) {
          return 'Domain parts cannot be empty'
        }
        if (part.length > 63) {
          return 'Domain parts cannot exceed 63 characters'
        }
        if (part.startsWith('-') || part.endsWith('-')) {
          return 'Domain parts cannot start or end with hyphens'
        }
      }

      return null // Valid domain
    }
    catch (_error) {
      return 'Invalid domain format'
    }
  }

  const handleDomainDelete = (domainToDelete: string) => {
    if (onDomainsChange) {
      const updatedDomains = domains.filter(domain => domain !== domainToDelete)
      onDomainsChange(updatedDomains)
    }
  }

  const handleDomainAdd = () => {
    const trimmedDomain = tempDomain.trim().toLowerCase()

    // Validate domain format first
    const validationError = validateDomain(trimmedDomain)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    // Check if domain is already associated with another institution
    if (Object.keys(domainToInstitutionMap).includes(trimmedDomain)) {
      setErrorMessage('This domain is associated with another institution: ' + domainToInstitutionMap[trimmedDomain].name)
    }
    else if (domains.includes(trimmedDomain)) {
      setErrorMessage('This domain has already been added')
    }
    else if (onDomainsChange) {
      const updatedDomains = [...domains, trimmedDomain]
      onDomainsChange(updatedDomains)
      setTempDomain('')
      setErrorMessage('')
    }
  }

  return (
    <div style={{ paddingTop: 20 }}>
      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: 18 }}>Domains</div>
      <div style={{ marginBottom: 10 }}>
        {domains.map(domain => (
          <DomainChip
            key={domain}
            domain={domain}
            editMode={isEditing}
            onDelete={() => handleDomainDelete(domain)}
          />
        ))}
      </div>

      {(!isEditing && domains.length === 0)
        && <div className="italic">This institution is not associated with any domains</div>}

      {isEditing && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
            <TextField
              variant="outlined"
              value={tempDomain}
              placeholder="e.g., example.com"
              size="small"
              InputProps={{
                style: { fontSize: 14 },
              }}
              FormHelperTextProps={{
                style: { fontSize: 14 },
              }}
              style={{ width: 250 }}
              onChange={(e) => {
                setTempDomain(e.target.value)
                // Clear error message when user starts typing
                if (errorMessage) {
                  setErrorMessage('')
                }
              }}
              onBlur={() => {
                // Validate domain when user leaves the field
                const trimmed = tempDomain.trim().toLowerCase()
                if (trimmed && !errorMessage) {
                  const validationError = validateDomain(trimmed)
                  if (validationError) {
                    setErrorMessage(validationError)
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tempDomain.trim()) {
                  handleDomainAdd()
                }
              }}
              error={!!errorMessage}
              helperText={!errorMessage ? 'Enter a valid domain name' : undefined}
            />
            <Button
              variant="contained"
              onClick={handleDomainAdd}
              style={{ marginLeft: 10, marginTop: 1, fontSize: 14, width: 'auto' }}
              disabled={!tempDomain.trim()}
            >
              Add
            </Button>
          </div>
          {errorMessage && (
            <div style={{ color: 'red', fontSize: 14, marginTop: 4, marginLeft: 2 }}>
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface DomainChipProps {
  domain: string
  editMode: boolean
  onDelete?: () => void
}

const DomainChip = ({ domain, editMode, onDelete }: DomainChipProps) => {
  return (
    <Chip
      key={domain}
      label={domain}
      variant="outlined"
      style={{
        marginRight: 5,
        fontSize: 12,
        color: editMode ? undefined : '#7b7b7b',
        borderColor: editMode ? undefined : '#7b7b7b',
      }}
      onDelete={editMode ? onDelete : undefined}
    />
  )
}
