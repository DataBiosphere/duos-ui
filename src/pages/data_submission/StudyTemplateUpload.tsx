import React, { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Styles, Theme } from 'src/libs/theme'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DownloadLink } from 'src/components/DownloadLink'
import { AsyncSpinnerButton } from 'src/components/AsyncSpinnerButton'
import { Draft } from 'src/libs/ajax/Draft'
import { Notifications } from 'src/libs/utils'
import { fileDownload } from 'src/utils/FileDownload'
import {
  BLANK_TEMPLATE_FILENAME,
  BLANK_TEMPLATE_MIME,
  MAX_TEMPLATE_BYTES,
  MAX_TEMPLATE_SIZE_MESSAGE,
  buildBlankStudyTemplateV1,
} from 'src/libs/studyTemplate/studyTemplateV1Csv'
import { STUDY_DATASET_DRAFT_TYPE, TemplateValidationError } from 'src/types/studyTemplate'

const FILE_INPUT_ID = 'study-template-file'

const describeLocation = (error: TemplateValidationError): string | null => {
  if (error.row === undefined) return null
  return error.column === undefined ? `Row ${error.row}` : `Row ${error.row}, column ${error.column}`
}

export const StudyTemplateUpload = (): React.JSX.Element => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [validationErrors, setValidationErrors] = useState<TemplateValidationError[]>([])
  const [truncated, setTruncated] = useState(false)

  // Failures are toasts, matching the rest of the app. Validation errors are not failures: they are a
  // completed result the user works through while editing their file, so they stay on the page.
  const clearResults = useCallback(() => {
    setValidationErrors([])
    setTruncated(false)
  }, [])

  const handleDownload = useCallback(() => {
    fileDownload(buildBlankStudyTemplateV1(), BLANK_TEMPLATE_FILENAME, BLANK_TEMPLATE_MIME)
  }, [])

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.[0] ?? null
    clearResults()
    if (!selected) {
      setFile(null)
      return
    }
    // Pre-checks the two limits Consent enforces, so a doomed 5 MiB upload never leaves the browser.
    // Wording matches the server's so the two layers cannot appear to disagree.
    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setFile(null)
      Notifications.showError({ text: 'Template file must be a .csv file' })
      return
    }
    if (selected.size > MAX_TEMPLATE_BYTES) {
      setFile(null)
      Notifications.showError({ text: MAX_TEMPLATE_SIZE_MESSAGE })
      return
    }
    setFile(selected)
  }, [clearResults])

  const handleRemove = useCallback(() => {
    setFile(null)
    clearResults()
    // Resetting the element lets the user re-select the same filename and still get a change event.
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [clearResults])

  const handleValidate = useCallback(async () => {
    if (!file) return
    clearResults()
    try {
      const result = await Draft.validateStudyDatasetTemplate(file)
      if (!result.valid) {
        setValidationErrors(result.errors)
        setTruncated(result.truncated === true)
        return
      }
      if (result.draft?.draftType !== STUDY_DATASET_DRAFT_TYPE || !result.draft.id) {
        Notifications.showError({ text: 'The template validated but the response did not identify a study/dataset draft. Please try again or contact support.' })
        return
      }
      navigate(`/data_submission_form/draft/study-dataset/${result.draft.id}`)
    }
    catch (error) {
      Notifications.showError({
        text: error instanceof Error ? error.message : 'The template could not be validated. Please try again.',
      })
    }
  }, [file, clearResults, navigate])

  return (
    <div style={Styles.PAGE}>
      <TableHeaderSection
        title="Upload Study Template"
        description="Validate a completed study/dataset template before registering it in DUOS."
      />

      <div style={{ margin: 'auto', maxWidth: 800, padding: '2rem 0' }}>
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem' }}>1. Start from the blank template</h2>
          <p style={{ fontSize: '1.4rem' }}>
            The template lists every field DUOS accepts, one per row. Fill in the
            {' '}
            <strong>value</strong>
            {' '}
            column and leave the other columns as they are. To register more than one dataset, copy
            the
            {' '}
            <strong>consentGroup</strong>
            {' '}
            rows and give the copies a new <strong>recordId</strong>.
          </p>
          <DownloadLink label="Download blank template" onDownload={handleDownload} />
        </section>

        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem' }}>2. Upload your completed template</h2>
          <p style={{ fontSize: '1.4rem' }}>
            Comma-separated
            {' '}
            <strong>.csv</strong>
            {' '}
            files only, up to 5 MiB. Documents such as the NIH institutional certification are added
            on the registration form after validation.
          </p>

          <label
            htmlFor={FILE_INPUT_ID}
            className="button button-white"
            style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
          >
            {file ? 'Choose a different file' : 'Choose CSV file'}
          </label>
          <input
            ref={inputRef}
            id={FILE_INPUT_ID}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          {file && (
            <div style={{ marginTop: '1rem', fontSize: '1.4rem' }}>
              <span>
                Selected file:
                {' '}
                <strong>{file.name}</strong>
              </span>
              <button
                type="button"
                className="button button-white"
                aria-label={`Remove ${file.name}`}
                onClick={handleRemove}
                style={{ marginLeft: '1.5rem' }}
              >
                Remove
              </button>
            </div>
          )}
        </section>

        <AsyncSpinnerButton
          id="validate-template-btn"
          className="button button-blue"
          onClick={handleValidate}
          disabled={!file}
          // The button must survive its own success: a template with errors resolves normally, and
          // the default hide-on-success would remove the control the user needs to retry with.
          hideOnSuccess={false}
        >
          Validate
        </AsyncSpinnerButton>

        <div aria-live="polite" style={{ marginTop: '2rem' }}>
          {validationErrors.length > 0 && (
            <div style={{ fontSize: '1.4rem' }}>
              <h2 style={{ fontSize: '2rem', color: Theme.palette.error }}>
                {`Your template has ${validationErrors.length} ${validationErrors.length === 1 ? 'error' : 'errors'}`}
              </h2>
              <p>Correct them in your file, then upload it again.</p>
              <ul>
                {validationErrors.map((error, index) => {
                  const location = describeLocation(error)
                  return (
                    <li key={`${error.row ?? 'none'}-${error.column ?? 'none'}-${index}`}>
                      {location && (
                        <>
                          <strong>{location}</strong>
                          {': '}
                        </>
                      )}
                      <span>{error.message}</span>
                    </li>
                  )
                })}
              </ul>
              {truncated && <p>Further errors were omitted. Fix these and validate again to see the rest.</p>}
            </div>
          )}
        </div>

        <p style={{ marginTop: '2.5rem', fontSize: '1.4rem' }}>
          Would you rather fill in the form directly?
          {' '}
          <Link to="/data_submission_form">Register a study without a template</Link>.
        </p>
      </div>
    </div>
  )
}

export default StudyTemplateUpload
