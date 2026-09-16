import React, { useEffect, useState } from 'react'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAR } from 'src/libs/ajax/DAR'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { formatDate, Notifications } from 'src/libs/utils'
import { Styles, Theme } from 'src/libs/theme'
import { ReadMore } from 'src/components/ReadMore'
import { DatasetExportButton } from 'src/components/data_search/DatasetExportButton'
import { Button, Tooltip } from '@mui/material'
import {
  DatasetStatisticsDar,
  DatasetTerm,
} from 'src/types/model'
import { ElasticsearchQuery } from 'src/types/elastic'
import { SnapshotSummaryModel, EnumerateSnapshotModel } from 'src/types/tdrModel'
import { extractError, extractStatus } from 'src/utils/ErrorUtils'
import { createDataUseDisplay } from 'src/utils/DataUseUtils'
import { useParams, useNavigate } from 'react-router'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { intersection } from 'src/utils/NodashUtil'
import InstantApprovalBadge from 'src/components/data_library/InstantApprovalBadge'
import {
  ACTIVE_RESEARCHER_STATUS_REQUIRED, hasActiveResearcherStatus,
} from 'src/hooks/useApplyForAccessEligibility'

const LINE = <div style={{ borderTop: '1px solid #BABEC1', height: 0 }} />

enum AccessManagement {
  OPEN = 'open',
  CONTROLLED = 'controlled',
  EXTERNAL = 'external',
}

const LabeledField = ({ label, children }: { label: string, children: React.ReactNode }) => {
  return (
    <div style={{ paddingTop: 20 }}>
      <span style={{ fontWeight: 600 }}>
        {label}
        :
        {' '}
      </span>
      {children}
    </div>
  )
}

export default function DatasetStatistics() {
  usePageTitle('Dataset Details')
  const params = useParams<{ datasetIdentifier: string }>()
  const navigate = useNavigate()
  const datasetIdentifier = params.datasetIdentifier || ''
  const [datasetTerm, setDatasetTerm] = useState<DatasetTerm>()
  const [dars, setDars] = useState<Array<DatasetStatisticsDar>>()
  // Set when the request history is withheld rather than absent, so the section can say which.
  const [darsRestricted, setDarsRestricted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [exportableSnapshots, setExportableSnapshots] = useState<SnapshotSummaryModel[]>([])

  const instantApprovalEligible = datasetTerm?.instantApprovalEligible === true

  const showError = (message: string) => {
    Notifications.showError({
      severity: 'error',
      text: `Error: ${message}`,
      timeout: 3500,
      layout: {
        vertical: 'bottom',
        horizontal: 'right',
      },
    })
  }

  const applyForAccess = async () => {
    try {
      const draftResponse = await DAR.postDarDraft({ datasetId: [datasetTerm?.datasetId] })
      if (draftResponse.referenceId) {
        navigate(`/dar_application/${draftResponse.referenceId}`)
      }
      else {
        showError('Unable to create a Draft Data Access Request')
      }
    }
    catch (error) {
      showError('Unable to create a Draft Data Access Request: ' + extractError(error))
    }
  }

  const getMatchPhrase = (datasetIdentifier: string) => {
    if (datasetIdentifier.startsWith('DUOS-D')) {
      const id = Number.parseInt(datasetIdentifier.replace('DUOS-D', ''))
      return {
        datasetId: id,
      }
    }
    else {
      return {
        datasetIdentifier: datasetIdentifier,
      }
    }
  }

  /**
   * The request history for one dataset. Separate from the effect below because a refusal here is
   * its own outcome rather than a failure of the page: the endpoint is gated on being able to read
   * the dataset's study, and an unpublished study is readable by its creator, its custodians and
   * admins alone - which is a different thing to tell the reader than "the server failed".
   */
  const loadDarsFor = async (datasetId: number, isCancelled: () => boolean) => {
    try {
      const dars: Array<DatasetStatisticsDar> = await DatasetMetrics.getDatasetStats(datasetId)
      if (isCancelled()) return
      setDars(dars)
    }
    catch (error) {
      if (isCancelled()) return
      if (extractStatus(error) === 403) {
        setDarsRestricted(true)
      }
      else {
        showError('Unable to retrieve dataset statistics from server: ' + extractError(error))
      }
    }
  }

  useEffect(() => {
    // Latched, because two quick navigations can resolve out of order and the older request's
    // writes would land last - reintroducing exactly the cross-dataset bleed the resets below
    // are here to prevent. Clearing state first does not help with that; only ignoring the
    // answers to a question the page has stopped asking does.
    let cancelled = false
    const init = async () => {
      // This page is not remounted between datasets - the route parameter changes and the effect
      // re-runs - so last dataset's answers have to be cleared before asking about the next one.
      // Left alone, a 403 on an unpublished study rendered the previous dataset's request history
      // beside the restriction notice, and returning to a readable dataset kept the notice.
      // datasetTerm is cleared too: if the next lookup throws or matches no single dataset, both
      // paths stop without setting it, so the previous dataset's page would otherwise still be on
      // screen under the new URL - and Apply for Access would draft a DAR against it.
      setDatasetTerm(undefined)
      setDars(undefined)
      setDarsRestricted(false)
      setIsLoading(true)
      try {
        const datasetTerms: DatasetTerm[] = await DataSet.searchDatasetIndex({
          query: {
            bool: {
              must: [
                {
                  match: {
                    _index: 'dataset',
                  },
                },
                {
                  match_phrase: getMatchPhrase(datasetIdentifier),
                },
              ],
            },
          },
        } as ElasticsearchQuery)

        if (cancelled) return
        if (datasetTerms.length === 1) {
          setDatasetTerm(datasetTerms[0])
          await loadDarsFor(datasetTerms[0].datasetId, () => cancelled)
          if (cancelled) return
          setIsLoading(false)
        }
        else {
          showError(`Unable to retrieve dataset statistics from server: dataset ${datasetIdentifier} not found.`)
          setIsLoading(false)
          return
        }
      }
      catch (error) {
        if (cancelled) return
        showError('Unable to retrieve dataset statistics from server: ' + extractError(error))
        setIsLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [datasetIdentifier])

  useEffect(() => {
    const fetchExportableSnapshots = async () => {
      if (!datasetIdentifier) {
        setExportableSnapshots([])
        return
      }
      try {
        const result: EnumerateSnapshotModel = await TerraDataRepo.listSnapshotsByDatasetIds([datasetIdentifier])
        if (result.filteredTotal > 0) {
          const exportable = result.items.filter(
            (snapshot: SnapshotSummaryModel) => intersection(result.roleMap[snapshot.id] ?? [], ['steward', 'reader']).length > 0,
          )
          setExportableSnapshots(exportable)
        }
        else {
          setExportableSnapshots([])
        }
      }
      catch {
        setExportableSnapshots([])
      }
    }
    fetchExportableSnapshots()
  }, [datasetIdentifier])

  const isActiveResearcher = hasActiveResearcherStatus()

  const accessInstructions = () => {
    const accessManagement = datasetTerm?.accessManagement as AccessManagement
    const locationUrl = datasetTerm?.url
    const validLocationUrl = validateHttpUrl(locationUrl)
    switch (accessManagement) {
      case AccessManagement.CONTROLLED:
        return (
          // Gated on the same predicate as every other apply-for-access entry point. This route
          // is public, so it is reachable by a visitor who holds no card at all.
          <Tooltip title={isActiveResearcher ? '' : ACTIVE_RESEARCHER_STATUS_REQUIRED}>
            <span>
              <Button
                variant="contained"
                onClick={applyForAccess}
                style={{ fontSize: '12px' }}
                disabled={!isActiveResearcher}
              >
                Apply for Access
              </Button>
            </span>
          </Tooltip>
        )
      case AccessManagement.OPEN:
        return (
          <span>
            This dataset is open access, does not require an access request
            {validLocationUrl
              && (
                <span>
                  , and can be accessed directly through this{' '}
                  <a href={validLocationUrl}>link</a>.
                </span>
              )}
          </span>
        )
      case AccessManagement.EXTERNAL:
        return (
          <span>
            This dataset is externally managed. Requests cannot be made via DUOS
            {validLocationUrl
              && (
                <span>
                  , but must be made directly through the{' '}
                  <a
                    href={validLocationUrl}
                  >
                    dataset&apos;s host repository
                  </a>.
                </span>
              )}
          </span>
        )
      default:
        return <span>N/A</span>
    }
  }

  if (!isLoading && datasetTerm) {
    return (
      <div style={{ ...Styles.PAGE, color: Theme.palette.primary }}>
        <div style={{ justifyContent: 'space-between' }}>
          <div style={{ marginTop: '25px' }}>
            <div style={{ fontSize: 20, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                {datasetTerm.datasetIdentifier} - {datasetTerm.datasetName}
              </div>
              {instantApprovalEligible && <InstantApprovalBadge />}
            </div>
            <LabeledField label="Study">
              {datasetTerm.study?.studyName}
            </LabeledField>
            <LabeledField label="Access Type">
              {accessInstructions()}
            </LabeledField>
            {(datasetTerm.accessManagement === AccessManagement.CONTROLLED || datasetTerm.accessManagement === AccessManagement.EXTERNAL)
              && (
                <LabeledField label="Data Use">
                  {createDataUseDisplay({
                    dataset: datasetTerm,
                    divStyle: { display: 'inline-block' },
                    tooltipPlace: 'right',
                  })}
                </LabeledField>
              )}
            <LabeledField label="Data Location">
              <div style={{ display: 'inline-flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {validateHttpUrl(datasetTerm.url)
                  ? (
                      <a href={datasetTerm.url} target="_blank" rel="noopener noreferrer">
                        {datasetTerm.dataLocation}
                      </a>
                    )
                  : datasetTerm.dataLocation}
                <DatasetExportButton snapshots={exportableSnapshots} />
              </div>
            </LabeledField>
            {datasetTerm.requestLocation && (
              <LabeledField label="Request Location">
                <a href={validateHttpUrl(datasetTerm.requestLocation) ? datasetTerm.requestLocation : undefined} target="_blank" rel="noopener noreferrer">
                  {datasetTerm.requestLocation}
                </a>
              </LabeledField>
            )}
            <LabeledField label="Phenotype">
              {datasetTerm.study?.phenotype ?? 'N/A'}
            </LabeledField>
            <LabeledField label="Participants">
              {datasetTerm.participantCount}
            </LabeledField>
            <LabeledField label="Principal Investigator">
              {datasetTerm.study?.piName}
            </LabeledField>
            <LabeledField label="Data Custodian">
              {datasetTerm.study?.dataCustodianEmail?.join(', ') ?? 'N/A'}
            </LabeledField>
            <div style={{ paddingTop: '20px' }}>
              {datasetTerm.study?.description}
            </div>
          </div>
          <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid black', width: '100%' }} />
          <div style={Styles.SUB_HEADER}>Data Access Requests for this dataset</div>
          {darsRestricted && (
            // <output> carries an implicit status role and is announced more reliably than a div
            // wearing role="status". It is inline by default, so the block display keeps the
            // spacing the surrounding notices have.
            <output style={{ display: 'block', paddingTop: '20px', fontStyle: 'italic' }}>
              You do not have access to this dataset&apos;s data access request history. While a
              study is unpublished its history is visible only to the study&apos;s creator, its
              custodians, and admins.
            </output>
          )}
          {!darsRestricted && dars?.length === 0
            && (
              <div style={{ paddingTop: '20px', fontStyle: 'italic' }}>
                No Data Access Requests have been created for this dataset.
              </div>
            )}
          {dars?.map((dar: DatasetStatisticsDar) => (
            <div
              style={Styles.READ_MORE as React.CSSProperties}
              id={`${dar.darCode}`}
              key={`${dar.darCode}`}
            >
              <ReadMore
                readLessText="Show less"
                readMoreText="Show More"
                readStyle={{ fontWeight: 500, margin: '20px', height: 0 }}
                content={[
                  <div key="dar" style={{ display: 'flex' }}>
                    <div
                      style={{ ...Styles.MEDIUM, width: '12%', margin: '15px' }}
                    >{dar.darCode}
                    </div>
                    <div style={{ ...Styles.MEDIUM, margin: '15px' }}>{dar.projectTitle}</div>
                  </div>,
                  React.cloneElement(LINE, { key: 'line-header' }),
                ]}
                moreContent={[
                  <div key="updated" style={{ display: 'flex', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', paddingRight: '2rem' }}>
                      <div style={Styles.SMALL_BOLD}>Last Updated:</div>
                      <div style={{ ...Styles.SMALL_BOLD, color: `${dar.expired ? 'red' : 'rgb(31, 59, 80)'}` }}>
                        {formatDate(dar.updateDate)}
                        {dar.expired && ' (Expired)'}
                      </div>
                    </div>
                  </div>,
                  <div key="requester" style={{ display: 'flex', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', paddingRight: '2rem' }}>
                      <div style={Styles.SMALL_BOLD}>PI:</div>
                      <div style={{ fontSize: Theme.font.size.small }}>{dar.piName || 'Not provided'}</div>
                    </div>
                    <div style={{ display: 'flex', paddingRight: '2rem' }}>
                      <div style={Styles.SMALL_BOLD}>Institution:</div>
                      <div style={{ fontSize: Theme.font.size.small }}>
                        {dar.institutionName || 'Not provided'}
                      </div>
                    </div>
                  </div>,
                  <div key="summary" style={{ backgroundColor: 'white' }}>
                    <div style={Styles.SMALL_BOLD}>NonTechnical Summary:</div>
                    <div style={{ fontSize: Theme.font.size.small, padding: '0 1rem 1rem 1rem' }}>
                      {dar.nonTechRus}
                    </div>
                  </div>,
                  React.cloneElement(LINE, { key: 'line-footer' }),
                ]}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
  else {
    return null
  }
}
