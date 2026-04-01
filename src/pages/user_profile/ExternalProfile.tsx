import React, { useEffect, useState } from 'react'
import './ExternalProfile.css'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import IconButton from '@mui/material/IconButton'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { ExternalProfiles } from 'src/types/model'

interface ExternalProfileProps {
  readonly userId?: number
  readonly readonly?: boolean
}

export default function ExternalProfile(props: ExternalProfileProps) {
  const { readonly } = props
  const [externalProfilesUpdate, setExternalProfilesUpdate] = useState<ExternalProfiles>({})
  const [linkedIn, setLinkedIn] = useState<string>('')
  const [orcid, setOrcid] = useState<string>('')
  const [throughBio, setThroughBio] = useState<string>('')
  const [institutionalWebsite, setInstitutionalWebsite] = useState<string>('')
  const [otherUrls, setOtherUrls] = useState<string[]>([])
  const [invalidUrls, setInvalidUrls] = useState<Array<string>>([])

  const formattedLinkedIn = (profileId: string | undefined): string => {
    return `https://www.linkedin.com/in/${profileId ?? ''}`
  }

  const formattedOrcid = (profileId: string | undefined): string => {
    return `https://orcid.org/${profileId ?? ''}`
  }

  const formattedThroughBio = (profileId: string | undefined): string => {
    return `https://through.bio/${profileId ?? ''}`
  }

  const onChange = ({ key, value }: { key: string, value: unknown }) => {
    setExternalProfilesUpdate((previous) => {
      const next = structuredClone(previous)
      if (typeof key === 'string') {
        next[key as keyof ExternalProfiles] = value as any // eslint-disable-line @typescript-eslint/no-explicit-any
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

  const onOtherUrlChange = (event: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const value = event.target.value
    handleValidity(event, `Other URL ${idx + 1}`)
    const newUrls = [...otherUrls]
    newUrls[idx] = value
    setOtherUrls(newUrls)
    onChange({ key: 'otherUrls', value: newUrls })
  }

  const addNewOtherUrl = () => {
    const newUrls = [...otherUrls, '']
    setOtherUrls(newUrls)
    onChange({ key: 'otherUrls', value: newUrls })
  }

  const removeEntry = (idx: number) => {
    const newUrls = [...otherUrls]
    newUrls.splice(idx, 1)
    setOtherUrls(newUrls)
    setInvalidUrls((previous) => {
      const next = [...previous]
      const index = next.indexOf(`Other URL ${idx + 1}`)
      if (index > -1) {
        next.splice(index, 1)
      }
      return next
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
      setOtherUrls(externalProfiles?.otherUrls ?? [])
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
    return (
      getUrlLink(formattedLinkedIn(linkedIn))
    )
  }

  const getOrcidLink = () => {
    return (
      getUrlLink(formattedOrcid(orcid))
    )
  }

  const getThroughBioLink = () => {
    return (
      getUrlLink(formattedThroughBio(throughBio))
    )
  }

  const getInstitutionalWebsiteLink = () => {
    return (
      getUrlLink(institutionalWebsite)
    )
  }

  const getUrlLink = (url: string) => {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    )
  }

  return readonly
    ? (
        <div>
          <h4>External Profile</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ fontWeight: 'bold' }}>Linked In</div><div>{getLinkedInLink()}</div>
            <div style={{ fontWeight: 'bold' }}>ORCID iD</div><div>{getOrcidLink()}</div>
            <div style={{ fontWeight: 'bold' }}>Through.bio</div><div>{getThroughBioLink()}</div>
            <div style={{ fontWeight: 'bold' }}>Institutional Website</div><div>{getInstitutionalWebsiteLink()}</div>
            {otherUrls && otherUrls.length > 0 && otherUrls.map((url, index) => (
              <React.Fragment key={index}>
                <div>Other URL {index + 1}</div><div>{getUrlLink(url)}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )
    : (
        <div className="external-profile">
          <div className="header-container">
            <h1> External Profile
            </h1>
          </div>
          <div style={{ marginTop: '20px' }} />
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>ID</th>
                <th>Link</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <label htmlFor="linkedIn">LinkedIn</label>
                </td>
                <td>
                  <input
                    type="text"
                    id="linkedIn"
                    name="linkedIn"
                    placeholder="LinkedIn Profile User ID (e.g. https://www.linkedin.com/in/username)"
                    value={linkedIn}
                    onChange={onLinkedInChange}
                    minLength={2}
                  />
                </td>
                <td>
                  { getLinkedInLink() }
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="ORCID">ORCID iD</label>
                </td>
                <td>
                  <input
                    type="text"
                    id="ORCID"
                    name="ORCID"
                    style={{ padding: '25px 15px', borderRadius: '4px', border: '1px solid #ccc', width: '400px', height: '34px', color: '#555555', backgroundColor: '#fff', transition: 'border-color ease-in-out .15s, box-shadow ease-in-out .15s' }}
                    placeholder="ORCID iD (e.g. https://orcid.org/0000-0000-0000-0000)"
                    value={orcid}
                    minLength={2}
                    onChange={onOrcidChange}
                  />
                </td>
                <td>
                  { getOrcidLink() }
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="throughBio">Through.bio</label>
                </td>
                <td>
                  <input
                    type="text"
                    id="throughBio"
                    name="throughBio"
                    placeholder="Through.bio profile id (e.g. https://through.bio/<profile-id>)"
                    value={throughBio}
                    minLength={2}
                    onChange={onThroughBioChange}
                  />
                </td>
                <td>
                  { getThroughBioLink() }
                </td>
              </tr>
              <tr>
                <td>
                  <label htmlFor="institutionalWebsite">Institutional Website</label>
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
                <td>
                  { getInstitutionalWebsiteLink() }
                </td>
              </tr>
              {otherUrls && otherUrls.length > 0 && otherUrls.map((url, index) => (
                <tr key={index}>
                  <td>
                    <label htmlFor={`otherUrl${index}`}>Other URL {index + 1}</label>
                  </td>
                  <td>
                    <input
                      type="url"
                      id={`otherUrl${index}`}
                      name={`Other URL ${index + 1}`}
                      placeholder="Other URL"
                      value={url}
                      onChange={(event) => {
                        onOtherUrlChange(event, index)
                      }}
                      onBlur={(event) => { event.target.reportValidity() }}
                      disabled={readonly}
                    />
                  </td>
                  <td>
                    && <IconButton aria-label="remove entry" onClick={() => { removeEntry(index) }}><RemoveCircleOutlineIcon /></IconButton>
                    { getUrlLink(url) }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addNewOtherUrl} className="btn-secondary">Add URL</button>
          <button style={{ marginLeft: '30px' }}disabled={invalidUrls.length > 0} onClick={onSaveClick} className="btn-primary">Save</button>
        </div>
      )
}
