import React, { useEffect, useState } from 'react'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetTerm, StudyTerm } from 'src/types/model'
import { ElasticsearchQuery } from 'src/types/elastic'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { chain, intersection } from 'src/utils/NodashUtil'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'
import { applyForAccess } from 'src/utils/accessUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { AssetType, ExportableDatasets, SortOrder } from 'src/types/library'

interface SectionProps {
  style?: React.CSSProperties
}

const Section = ({ style, children }: React.PropsWithChildren<SectionProps>) =>
  <div style={{ paddingTop: 20, paddingRight: 100, ...style }}>{children}</div>

const EMPTY_DATASETS: DatasetTerm[] = []
const INITIAL_PAGINATION = { page: 0, pageSize: 25 }

export const StudyDetails = () => {
  usePageTitle('Study Details')
  const params = useParams<{ studyId: string }>()
  const studyId = params.studyId
  const navigate = useNavigate()
  const [datasetState, setDatasetState] = useState<{
    studyId?: string
    datasets: DatasetTerm[]
    error?: Error
  }>({ datasets: EMPTY_DATASETS })
  const [exportableDatasets, setExportableDatasets] = useState<ExportableDatasets>({})
  const [selectionState, setSelectionState] = useState<{ studyId?: string, datasetIds: number[] }>({ datasetIds: [] })
  const [paginationState, setPaginationState] = useState<{ studyId?: string, model: typeof INITIAL_PAGINATION }>({ model: INITIAL_PAGINATION })
  const [sortState, setSortState] = useState<{ studyId?: string, model: Array<{ field: string, sort: SortOrder | null }> }>({ model: [] })

  const loading = datasetState.studyId !== studyId
  const error = loading ? undefined : datasetState.error
  const datasets = loading ? EMPTY_DATASETS : datasetState.datasets
  const selectedDatasets = selectionState.studyId === studyId ? selectionState.datasetIds : []
  const paginationModel = paginationState.studyId === studyId ? paginationState.model : INITIAL_PAGINATION
  const sortModel = sortState.studyId === studyId ? sortState.model : []

  const study: StudyTerm | undefined = datasets.length > 0 ? datasets[0].study : undefined
  const selectedStudyIds = Array.from(new Set(
    datasets
      .filter(dataset => selectedDatasets.includes(dataset.datasetId))
      .map(dataset => dataset.study.studyId),
  ))

  const getExportableDatasets = async (datasets: DatasetTerm[]) => {
    if (datasets.length === 0) {
      setExportableDatasets({})
      return
    }

    // Note the dataset identifier is in each sub-table row.
    const datasetIdentifiers = datasets.map(row => row.datasetIdentifier)
    try {
      const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers) as EnumerateSnapshotModel
      if (snapshots.filteredTotal > 0) {
        const datasetIdToSnapshot = chain(snapshots.items)
          .filter((snapshot: SnapshotSummaryModel) => intersection(snapshots.roleMap?.[snapshot.id] ?? [], ['steward', 'reader']).length > 0)
          .groupBy('duosId')
          .value()
        setExportableDatasets(datasetIdToSnapshot)
      }
      else {
        setExportableDatasets({})
      }
    }
    catch {
      setExportableDatasets({})
    }
  }

  useEffect(() => {
    let active = true
    const query = {
      from: 0,
      size: 10000,
      query: {
        bool: {
          must: [
            {
              match: {
                _index: 'dataset',
              },
            },
            {
              match: {
                'study.studyId': studyId,
              },
            },
            {
              exists: {
                field: 'study',
              },
            },
          ],
        },
      },
    }
    DataSet.searchDatasetIndex(query as ElasticsearchQuery)
      .then((datasets) => {
        if (active) {
          setDatasetState({ studyId, datasets })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setDatasetState({
            studyId,
            datasets: EMPTY_DATASETS,
            error: error instanceof Error ? error : new Error('Unknown error'),
          })
        }
      })

    return () => {
      active = false
    }
  }, [studyId])

  useEffect(() => {
    const init = async () => {
      await getExportableDatasets(datasets)
    }
    init()
  }, [datasets])

  const participantCount = loading || error
    ? undefined
    : datasets.reduce((total, dataset) => total + dataset.participantCount, 0)

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
          {error && <div role="alert">Unable to load datasets: {error.message}</div>}
          <div style={{ height: 600, marginTop: error ? 20 : 0 }}>
            <LibraryDataGrid
              assetType={AssetType.DATASETS}
              data={datasets}
              loading={loading}
              total={datasets.length}
              paginationModel={paginationModel}
              onPaginationChange={model => setPaginationState({ studyId, model })}
              paginationMode="client"
              sortModel={sortModel}
              onSortChange={model => setSortState({ studyId, model })}
              sortingMode="client"
              selectedDatasetIds={selectedDatasets}
              onSelectionChange={datasetIds => setSelectionState({ studyId, datasetIds })}
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
