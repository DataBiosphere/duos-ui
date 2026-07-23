import React, { useState } from 'react'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { applyForAccess } from 'src/utils/accessUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { AssetType, SortOrder, SortState } from 'src/types/library'
import { useStudyDatasets, useStudyExportableDatasets } from 'src/hooks/useStudyDetailsData'

interface SectionProps {
  style?: React.CSSProperties
}

const Section = ({ style, children }: React.PropsWithChildren<SectionProps>) =>
  <div style={{ paddingTop: 20, paddingRight: 100, ...style }}>{children}</div>

const INITIAL_PAGINATION = { page: 0, pageSize: 25 }

const getErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) return error.message
  if (error) return 'Unknown error'
  return undefined
}

interface StudyDetailsContentProps {
  studyId: string
}

const StudyDetailsContent = ({ studyId }: StudyDetailsContentProps) => {
  const navigate = useNavigate()
  const [selectedDatasets, setSelectedDatasets] = useState<number[]>([])
  const [paginationModel, setPaginationModel] = useState(INITIAL_PAGINATION)
  const [sortModel, setSortModel] = useState<Array<{ field: string, sort: SortOrder | null }>>([])
  const sort: SortState | undefined = sortModel[0]?.sort
    ? { field: sortModel[0].field, order: sortModel[0].sort }
    : undefined
  const { data, isFetching: loading, error } = useStudyDatasets(studyId, paginationModel, sort)
  const datasets = data?.items ?? []
  const study = data?.study
  const participantCount = data?.participantCount
  const { data: exportableDatasets } = useStudyExportableDatasets(studyId, datasets)
  const numericStudyId = Number(studyId)
  const selectedStudyIds = selectedDatasets.length > 0 && !Number.isNaN(numericStudyId)
    ? [numericStudyId]
    : []
  const errorMessage = getErrorMessage(error)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{ paddingLeft: 40 }}>
        <Link
          id="link_datalibrary"
          to="/datalibrary"
          className="navbar-brand"
          style={{ height: 28, width: 28 }}
        >
          <img id="back-arrow-icon" src={backArrowIcon} alt="Back" style={{ height: 28, width: 28 }} />
        </Link>
      </div>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          Back to library
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, paddingTop: 20 }}>
          <Link to={`/DUOS-S${study?.studyId ?? studyId}`}>
            DUOS-S{study?.studyId ?? studyId}
          </Link>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, paddingTop: 20 }}>
          {study?.studyName}
        </div>
        <Section>
          {study?.description}
        </Section>
        {participantCount !== undefined && !Number.isNaN(participantCount) && (
          <Section>
            <span style={{ fontWeight: 600 }}>Participants: </span>
            <span>
              {
                participantCount
              }
            </span>
          </Section>
        )}
        {study?.phenotype && (
          <Section>
            <span style={{ fontWeight: 600 }}>Phenotype: </span>
            <span>{study?.phenotype}</span>
          </Section>
        )}
        {study?.species && (
          <Section>
            <span style={{ fontWeight: 600 }}>Species: </span>
            <span>{study?.species}</span>
          </Section>
        )}
        {study?.piName && (
          <Section>
            <span style={{ fontWeight: 600 }}>PI Name: </span>
            <span>{study?.piName}</span>
          </Section>
        )}
        {study?.dataCustodianEmail && study.dataCustodianEmail.length > 0 && (
          <Section>
            <span style={{ fontWeight: 600 }}>Data Custodian: </span>
            <span>{study?.dataCustodianEmail.join(', ')}</span>
          </Section>
        )}
        <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid black', width: '100%' }}>
          {errorMessage && <div role="alert">Unable to load datasets: {errorMessage}</div>}
          <div style={{ height: 600, marginTop: errorMessage ? 20 : 0 }}>
            <LibraryDataGrid
              assetType={AssetType.DATASETS}
              data={datasets}
              loading={loading}
              total={data?.total ?? 0}
              paginationModel={paginationModel}
              onPaginationChange={setPaginationModel}
              sortModel={sortModel}
              onSortChange={setSortModel}
              selectedDatasetIds={selectedDatasets}
              onSelectionChange={setSelectedDatasets}
              exportableDatasets={exportableDatasets}
            />
          </div>
        </div>
      </div>
      <LibraryFooter
        selectedDatasetIds={selectedDatasets}
        selectedStudyIds={selectedStudyIds}
        onApplyForAccess={() => applyForAccess(selectedDatasets, navigate)}
      />
    </div>
  )
}

export const StudyDetails = () => {
  usePageTitle('Study Details')
  const { studyId = '' } = useParams<{ studyId: string }>()

  // Remount local grid state when navigating directly between study routes.
  return <StudyDetailsContent key={studyId} studyId={studyId} />
}
