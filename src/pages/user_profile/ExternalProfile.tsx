import React, { useEffect, useRef, useState } from 'react'
import './ExternalProfile.css'
import RemoveCircleOutlinedIcon from '@mui/icons-material/RemoveCircleOutlined'
import IconButton from '@mui/material/IconButton'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { ExternalProfiles } from 'src/types/model'
import { validateHttpUrl } from 'src/utils/UrlUtils'

interface ExternalProfileProps {
  readonly userId?: number
  readonly readonly?: boolean
}

interface OtherUrlEntry {
  id: string
  value: string
}

export default function ExternalProfile(props: ExternalProfileProps) {
  const { readonly } = props
  const nextOtherUrlId = useRef(0)
  const [externalProfilesUpdate, setExternalProfilesUpdate] = useState<ExternalProfiles>({})
  const [linkedIn, setLinkedIn] = useState<string>('')
  const [orcid, setOrcid] = useState<string>('')
  const [throughBio, setThroughBio] = useState<string>('')
  const [institutionalWebsite, setInstitutionalWebsite] = useState<string>('')
  const [otherUrls, setOtherUrls] = useState<OtherUrlEntry[]>([])
  const [invalidUrls, setInvalidUrls] = useState<Array<string>>([])

  const formattedLinkedIn = (profileId: string | undefined): string => {
    return validateHttpUrl(profileId) ?? `https://www.linkedin.com/in/${profileId ?? ''}`
  }

  const formattedOrcid = (profileId: string | undefined): string => {
    return validateHttpUrl(profileId) ?? `https://orcid.org/${profileId ?? ''}`
  }

  const formattedThroughBio = (profileId: string | undefined): string => {
    return validateHttpUrl(profileId) ?? `https://through.bio/${profileId ?? ''}`
  }

  const onChange = ({ key, value }: { key: string, value: unknown }) => {
    setExternalProfilesUpdate((previous) => {
      const next = structuredClone(previous)
      if (typeof key === 'string') {
        (next as Record<string, unknown>)[key] = value
      }
      return next
    })
  }

  const handleValidity = (event: React.ChangeEvent<HTMLInputElement>, name: string) => {
    event.target.reportValidity()
    if (event.target.validity.valid) {
      setInvalidUrls((previous) => {
        const next = [...previous]
        const index = next.indexOf(name)
        if (index > -1) {
          next.splice(index, 1)
        }
        return next
      })
    }
    else {
      setInvalidUrls((previous) => {
        const next = [...previous]
        if (!next.includes(name)) {
          next.push(name)
        }
        return next
      })
    }
  }

  const onLinkedInChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const linkedIn = 'linkedIn'
    const value = event.target.value
    handleValidity(event, linkedIn)
    setLinkedIn(value)
    onChange({ key: linkedIn, value })
  }

  const onOrcidChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const orcid = 'ORCID'
    const value = event.target.value
    handleValidity(event, orcid)
    setOrcid(value)
    onChange({ key: orcid, value })
  }

  const onThroughBioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const throughBio = 'throughBio'
    const value = event.target.value
    handleValidity(event, throughBio)
    setThroughBio(value)
    onChange({ key: throughBio, value })
  }

  const onInstitutionalWebsiteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const institutionalWebsite = 'institutionalWebsite'
    const value = event.target.value
    handleValidity(event, institutionalWebsite)
    setInstitutionalWebsite(value)
    onChange({ key: institutionalWebsite, value })
  }

  const onOtherUrlChange = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const value = event.target.value
    handleValidity(event, id)
    const newUrls = otherUrls.map(entry => entry.id === id ? { ...entry, value } : entry)
    setOtherUrls(newUrls)
    onChange({ key: 'otherUrls', value: newUrls.map(entry => entry.value) })
  }

  const addNewOtherUrl = () => {
    const newUrls = [
      ...otherUrls,
      { id: `other-url-${nextOtherUrlId.current++}`, value: '' },
    ]
    setOtherUrls(newUrls)
    onChange({ key: 'otherUrls', value: newUrls.map(entry => entry.value) })
  }

  const removeEntry = (id: string) => {
    const newUrls = otherUrls.filter(entry => entry.id !== id)
    setOtherUrls(newUrls)
    onChange({ key: 'otherUrls', value: newUrls.map(entry => entry.value) })
    setInvalidUrls((previous) => {
      return previous.filter(invalidUrl => invalidUrl !== id)
    })
  }

  const onSaveClick = () => {
    const payload = { userData: { externalProfiles: externalProfilesUpdate } }
    User.updateSelf(payload).then(() => {
      Notifications.showSuccess({ text: 'External Profile updated successfully!' })
    }).catch (() => {
      Notifications.showError({ text: 'Some errors occurred, your external profile was not updated.' })
    })
  }

  useEffect(() => {
    const initializeExternalProfiles = (externalProfiles: ExternalProfiles) => {
      setExternalProfilesUpdate(externalProfiles ?? {})
      setLinkedIn(externalProfiles?.linkedIn ?? '')
      setOrcid(externalProfiles?.ORCID ?? '')
      setThroughBio(externalProfiles?.throughBio ?? '')
      setInstitutionalWebsite(externalProfiles?.institutionalWebsite ?? '')
      setOtherUrls((externalProfiles?.otherUrls ?? []).map(value => ({
        id: `other-url-${nextOtherUrlId.current++}`,
        value,
      })))
    }

    const init = async () => {
      if (!readonly) {
        User.getMe().then((response) => {
          const externalProfiles = response.userData?.externalProfiles
          initializeExternalProfiles(externalProfiles ?? {})
        }).catch(() => {
          Notifications.showError({ text: 'Some errors occurred, your external profile could not be loaded.' })
        })
      }
      else if (props.userId) {
        User.getById(props.userId).then((response) => {
          const externalProfiles = response.userData?.externalProfiles
          initializeExternalProfiles(externalProfiles ?? {})
        }).catch(() => {
          Notifications.showError({ text: 'Some errors occurred, the user profile could not be loaded.' })
        })
      }
    }
    init()
  }, [readonly, props.userId])

  const getLinkedInLink = () => {
    if (!linkedIn) {
      return <span>{readonly ? 'No LinkedIn profile provided' : 'LinkedIn'}</span>
    }
    return getUrlLink(formattedLinkedIn(linkedIn))
  }

  const getOrcidLink = () => {
    if (!orcid) {
      return <span>{readonly ? 'No ORCID provided' : 'ORCID'}</span>
    }
    return getUrlLink(formattedOrcid(orcid))
  }

  const getThroughBioLink = () => {
    if (!throughBio) {
      return <span>{readonly ? 'No Through.bio profile provided' : 'Through.bio'}</span>
    }
    return getUrlLink(formattedThroughBio(throughBio))
  }

  const getInstitutionalWebsiteLink = () => {
    return (
      readonly && !institutionalWebsite ? <span>No institutional website provided</span> : getUrlLink(institutionalWebsite)
    )
  }

  const getUrlLink = (url: string) => {
    const validUrl = validateHttpUrl(url)
    if (!validUrl) {
      return <span>{url}</span>
    }

    return (
      <a href={validUrl} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
  }

  return readonly
    ? (
        <div>
          <h4>External Profile</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ fontWeight: 'bold' }}>LinkedIn</div><div>{getLinkedInLink()}</div>
            <div style={{ fontWeight: 'bold' }}>ORCID</div><div>{getOrcidLink()}</div>
            <div style={{ fontWeight: 'bold' }}>Through.bio</div><div>{getThroughBioLink()}</div>
            <div style={{ fontWeight: 'bold' }}>Institutional Website</div><div>{getInstitutionalWebsiteLink()}</div>
            {otherUrls.length > 0 && otherUrls.map((entry, index) => (
              <React.Fragment key={entry.id}>
                <div>Other URL {index + 1}</div><div>{getUrlLink(entry.value)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )
    : (
        <div className="external-profile">
          <div className="header-container">
            <h1>
              External Profiles
            </h1>
          </div>
          <table>
            <tbody>
              <tr>
                <td>
                  <div className="external-profile-value external-profile-link-value">{getLinkedInLink()}</div>
                </td>
                <td>
                  <input
                    type="text"
                    id="linkedIn"
                    name="linkedIn"
                    aria-label="LinkedIn"
                    placeholder="LinkedIn Profile User ID (e.g. https://www.linkedin.com/in/username)"
                    value={linkedIn}
                    onChange={onLinkedInChange}
                    minLength={2}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="external-profile-value external-profile-link-value">{getOrcidLink()}</div>
                </td>
                <td>
                  <input
                    type="text"
                    id="ORCID"
                    name="ORCID"
                    aria-label="ORCID"
                    placeholder="ORCID (e.g. https://orcid.org/0000-0000-0000-0000)"
                    value={orcid}
                    minLength={2}
                    onChange={onOrcidChange}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <div className="external-profile-value external-profile-link-value">{getThroughBioLink()}</div>
                </td>
                <td>
                  <input
                    type="text"
                    id="throughBio"
                    name="throughBio"
                    aria-label="Through.bio"
                    placeholder="Through.bio profile ID (e.g. https://through.bio/<profile-id>)"
                    value={throughBio}
                    minLength={2}
                    onChange={onThroughBioChange}
                  />
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="institutionalWebsite">Institutional Website</label>
                  {institutionalWebsite && <div className="external-profile-value external-profile-link-value">{getInstitutionalWebsiteLink()}</div>}
                </td>
                <td>
                  <input
                    type="url"
                    id="institutionalWebsite"
                    name="Institutional Website"
                    placeholder="Institutional Website (e.g. https://www.institution.edu/~username)"
                    value={institutionalWebsite}
                    onChange={onInstitutionalWebsiteChange}
                  />
                </td>
              </tr>
              {otherUrls.length > 0 && otherUrls.map((entry, index) => (
                <tr key={entry.id}>
                  <td>
                    <div className="external-profile-value external-profile-link-value">
                      {entry.value ? getUrlLink(entry.value) : <span>Other URL {index + 1}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="external-profile-input-with-action">
                      <input
                        type="url"
                        id={`otherUrl${index}`}
                        name={`Other URL ${index + 1}`}
                        aria-label={`Other URL ${index + 1}`}
                        placeholder="Other URL"
                        value={entry.value}
                        onChange={(event) => {
                          onOtherUrlChange(event, entry.id)
                        }}
                        onBlur={(event) => { event.target.reportValidity() }}
                      />
                      <IconButton aria-label={`Remove Other URL ${index + 1}`} onClick={() => { removeEntry(entry.id) }}><RemoveCircleOutlinedIcon /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="external-profile-actions">
            <button type="button" onClick={addNewOtherUrl} className="external-profile-add-url">+ Add URL</button>
            <button type="button" disabled={invalidUrls.length > 0} onClick={onSaveClick} className="btn-primary common-background external-profile-save-button">Save</button>
          </div>
        </div>
      )
}
