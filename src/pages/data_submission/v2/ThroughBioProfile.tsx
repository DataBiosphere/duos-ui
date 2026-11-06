import React, { useState } from 'react'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Study, ThroughBioId } from 'src/pages/data_submission/v2/v2-models'
import {
  extractThroughBioId,
  getStudyPropertyValueByKey,
  setStudyPropertyByKey,
} from 'src/pages/data_submission/v2/v2-common-functions'

const THROUGH_BIO_HELP_TEXT = 'Link this study to its Through.bio profile so people viewing the study in DUOS can go '
  + 'straight to it. A profile represents the Study as a whole, not its individual datasets or other assets, so a '
  + 'study has at most one. Enter the profile ID, which is the part of the profile\'s address after through.bio/, or '
  + 'paste the full profile link.'
const THROUGH_BIO_PUBLICATIONS_NOTICE = 'Publications are required to create a Through.bio profile. '
  + 'Add this study\'s publications under Related Resources before requesting one.'
const THROUGH_BIO_ERROR = 'Enter a Through.bio profile ID, or a link that starts with https://through.bio/'

/** The ID in what was typed or pasted: a bare ID, "through.bio/ID", or a full https://through.bio/ link. */
const profileIdFrom = (raw: string): string => {
  const trimmed = raw.trim()
  const withoutHost = trimmed.replace(/^(?:www\.)?through\.bio\//i, '')
  return withoutHost === trimmed ? extractThroughBioId(trimmed) : withoutHost
}

export interface ThroughBioProfileProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
  /** Opens the request; absent, the request option is not offered. */
  onRequestProfile?: () => void
}

export const ThroughBioProfile = (props: ThroughBioProfileProps) => {
  const { study, setStudy, onRequestProfile } = props
  const [showNotice, setShowNotice] = useState(false)

  const storedId = getStudyPropertyValueByKey(study, ThroughBioId.key)
  const id = typeof storedId === 'string' ? storedId : ''
  const hasProfile = id.trim() !== ''
  const link = hasProfile ? `https://through.bio/${id}` : undefined

  const [text, setText] = useState(id)
  const [invalid, setInvalid] = useState(false)
  // A study loaded after mount brings its ID; take it unless the box already says the same thing.
  const [prevId, setPrevId] = useState(id)
  if (prevId !== id) {
    setPrevId(id)
    if (profileIdFrom(text) !== id) {
      setText(id)
      setInvalid(false)
    }
  }

  const onChange = (raw: string) => {
    setText(raw)
    const extracted = profileIdFrom(raw)
    if (raw.trim() && !extracted) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    // An emptied box clears the stored ID too.
    setStudyPropertyByKey(study, setStudy, { isValid: true }, new ThroughBioId(extracted || undefined))
  }

  return (
    <div className="dsf-group dsf-through-bio" data-cy="through-bio-profile">
      <h3>Link to Through.bio Profile</h3>
      <p className="dsf-subtitle">{THROUGH_BIO_HELP_TEXT}</p>
      <div className={`formField-container formField-${ThroughBioId.key}`}>
        <label className={`control-label ${invalid ? 'errored' : ''}`} htmlFor={ThroughBioId.key}>Profile ID</label>
        {/* The fixed part of the address sits inside the field's frame, so only the ID is typed. */}
        <div className={`dsf-prefixed-input ${invalid ? 'errored' : ''}`}>
          <span className="dsf-input-prefix" id={`${ThroughBioId.key}-prefix`} aria-hidden="true">through.bio/</span>
          <input
            id={ThroughBioId.key}
            name={ThroughBioId.key}
            type="text"
            className={`form-control ${invalid ? 'errored' : ''}`}
            placeholder="your-study"
            value={text}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${ThroughBioId.key}-error` : undefined}
            onChange={event => onChange(event.target.value)}
            onBlur={() => {
              // A pasted link is shown as the ID it was reduced to, matching the prefix beside it.
              const extracted = profileIdFrom(text)
              if (extracted && extracted !== text) setText(extracted)
            }}
          />
        </div>
        {invalid && <div className="dsf-field-error" id={`${ThroughBioId.key}-error`} role="alert">{THROUGH_BIO_ERROR}</div>}
        {link && (
          <a className="dsf-through-bio-link" href={link} target="_blank" rel="noopener noreferrer">
            {`View ${link.replace('https://', '')}`}
          </a>
        )}
      </div>
      {!hasProfile && onRequestProfile && (
        <div className="dsf-through-bio-request">
          Don&apos;t have a Through.bio profile yet?
          {' '}
          {/* Reads as a link, but it opens the notice below rather than navigating, so it stays a button. */}
          <button
            type="button"
            className="dsf-text-link"
            id="request-through-bio-profile"
            aria-expanded={showNotice}
            aria-controls="through-bio-request-notice"
            title={THROUGH_BIO_PUBLICATIONS_NOTICE}
            onClick={() => setShowNotice(true)}
          >
            Request a Through.bio Profile
          </button>
          {showNotice && (
            <div className="dsf-notice" id="through-bio-request-notice" role="note">
              <InfoOutlinedIcon fontSize="small" aria-hidden="true" />
              <div>
                <p>{THROUGH_BIO_PUBLICATIONS_NOTICE}</p>
                <div className="dsf-notice-actions">
                  <button
                    type="button"
                    className="button button-blue"
                    id="through-bio-request-continue"
                    onClick={() => {
                      setShowNotice(false)
                      onRequestProfile()
                    }}
                  >
                    Continue to request
                  </button>
                  <button type="button" className="button button-white" id="through-bio-request-cancel" onClick={() => setShowNotice(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
