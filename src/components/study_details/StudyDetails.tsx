import React, { useState } from 'react'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Link, useParams, useNavigate } from 'react-router'
import { Typography, useMediaQuery, useTheme } from '@mui/material'
import { Theme } from 'src/libs/theme'
import { applyForAccess } from 'src/utils/accessUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { AssetType, SortOrder, SortState } from 'src/types/library'
import {
  useStudyDatasets,
  useStudyExportableDatasets,
  useStudySelectableDatasetIds,
} from 'src/hooks/useStudyDetailsData'
import { TocProvider, TableOfContents } from 'src/components/study_details/TableOfContents'
import StudyPageSection from 'src/components/study_details/StudyPageSection'
import StudySidebar from 'src/components/study_details/StudySidebar'
import StudyTitleBadges from 'src/components/study_details/StudyTitleBadges'
import StudyInfoTable from 'src/components/study_details/StudyInfoTable'

const INITIAL_PAGINATION = { page: 0, pageSize: 25 }
const EMPTY_PAGE = {
  items: [],
  total: 0,
  study: undefined,
  participantCount: undefined,
}

type StudySortModel = Array<{ field: string, sort: SortOrder | null }>

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
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false)
  const [paginationModel, setPaginationModel] = useState(INITIAL_PAGINATION)
  const [sortModel, setSortModel] = useState<StudySortModel>([])
  const sort: SortState | undefined = sortModel[0]?.sort
    ? { field: sortModel[0].field, order: sortModel[0].sort }
    : undefined
  const { data = EMPTY_PAGE, isFetching: loading, error } = useStudyDatasets(studyId, paginationModel, sort)
  const datasets = data.items
  const study = data.study
  const participantCount = data.participantCount
  const { data: exportableDatasets } = useStudyExportableDatasets(studyId, datasets)
  const selectedStudyIds = selectedDatasets.length > 0 && study
    ? [study.studyId]
    : []
  const errorMessage = getErrorMessage(error)
  const theme = useTheme()
  const isNarrowViewport = useMediaQuery(theme.breakpoints.down('md'))
  // Header row + one row per dataset (up to a full page) + pagination footer, so a study with
  // few datasets doesn't reserve a full page's worth of empty grid space. With no rows the grid
  // renders its own 50vh spinner/empty state instead, so the wrapper has to leave room for it.
  const datasetGridHeight = datasets.length === 0 ? '50vh' : 56 + datasets.length * 52 + 56

  // The default selection has to cover the whole study, not just the visible page, or
  // 'Apply for Access' would silently submit a subset of a study larger than one page.
  const pageSelectableIds = datasets
    .filter(dataset => datasetAsset.isRowSelectable(dataset))
    .map(dataset => dataset.datasetId)
  const needsStudyWideIds = data.total > datasets.length
  const studyWideIds = useStudySelectableDatasetIds(studyId, data.total, needsStudyWideIds)
  const selectableDatasetIds = needsStudyWideIds
    ? studyWideIds.data
    : pageSelectableIds

  // Seed the default selection once, on the first render where the ids are known. Adjusting
  // state during render rather than from an effect: React re-runs the component before it
  // commits, so the grid never paints an empty selection it immediately replaces. The latch
  // keeps a later page, sort, or refetch from overwriting what the user has since selected.
  if (
    !hasInitializedSelection
    && !loading
    && datasets.length > 0
    && selectableDatasetIds !== undefined
  ) {
    setHasInitializedSelection(true)
    setSelectedDatasets(selectableDatasetIds)
  }

  // A person can interact with the visible page before the study-wide id request completes.
  // Treat that as initialization too, so the late response cannot replace their deliberate
  // choice with every controlled dataset in the study.
  const handleSelectionChange = (datasetIds: number[]) => {
    setHasInitializedSelection(true)
    setSelectedDatasets(datasetIds)
  }

  return (
    <TocProvider>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={{ paddingLeft: 40, paddingTop: 4 }}>
          <Link
            id="link_datalibrary"
            to="/datalibrary"
            className="navbar-brand"
            style={{ height: 28, width: 28 }}
          >
            <img id="back-arrow-icon" src={backArrowIcon} alt="Back" style={{ height: 28, width: 28 }} />
          </Link>
        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: Theme.font.weight.semibold }}>
            Back to library
          </Typography>
          <StudyPageSection id="overview" heading="Overview" style={{ paddingTop: 20 }}>
            <Typography variant="body2" color="text.secondary">
              <Link to={`/DUOS-S${study?.studyId ?? studyId}`}>
                DUOS-S{study?.studyId ?? studyId}
              </Link>
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: Theme.font.weight.semibold, pt: 1 }}>
              {study?.studyName}
            </Typography>
            <StudyTitleBadges dataTypes={study?.dataTypes} />
            <Typography variant="body1" sx={{ pt: 2.5 }}>
              {study?.description}
            </Typography>
            <StudyInfoTable
              rows={[
                { label: 'Participants', value: participantCount },
                { label: 'Phenotype', value: study?.phenotype },
                { label: 'Species', value: study?.species },
                { label: 'PI Name', value: study?.piName },
                { label: 'Data Custodian', value: study?.dataCustodianEmail?.join(', ') },
              ]}
            />
          </StudyPageSection>
          <StudyPageSection id="datasets" heading="Datasets">
            {errorMessage && <div role="alert">Unable to load datasets: {errorMessage}</div>}
            {studyWideIds.isError && (
              <div role="alert">
                Unable to select every controlled dataset automatically. Select datasets manually before applying for access.
              </div>
            )}
            <div style={{ height: datasetGridHeight, marginTop: errorMessage ? 20 : 0 }}>
              <LibraryDataGrid
                assetType={AssetType.DATASETS}
                data={datasets}
                loading={loading}
                total={data.total}
                paginationModel={paginationModel}
                onPaginationChange={setPaginationModel}
                sortModel={sortModel}
                onSortChange={setSortModel}
                selectedDatasetIds={selectedDatasets}
                onSelectionChange={handleSelectionChange}
                exportableDatasets={exportableDatasets}
              />
            </div>
          </StudyPageSection>
        </div>
        {!isNarrowViewport && (
          <StudySidebar
            selectedDatasetIds={selectedDatasets}
            selectedStudyIds={selectedStudyIds}
            onApplyForAccess={() => applyForAccess(selectedDatasets, navigate)}
          >
            <TableOfContents />
          </StudySidebar>
        )}
      </div>
      {isNarrowViewport && (
        <LibraryFooter
          selectedDatasetIds={selectedDatasets}
          selectedStudyIds={selectedStudyIds}
          onApplyForAccess={() => applyForAccess(selectedDatasets, navigate)}
        />
      )}
    </TocProvider>
  )
}

export const StudyDetails = () => {
  usePageTitle('Study Details')
  const { studyId = '' } = useParams<{ studyId: string }>()

  // Remount local grid state when navigating directly between study routes.
  return <StudyDetailsContent key={studyId} studyId={studyId} />
}
