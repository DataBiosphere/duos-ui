import React, { useState } from 'react'
import backArrowIcon from 'src/images/back_arrow.svg'
import { Link, useParams, useNavigate } from 'react-router'
import { Alert, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Theme } from 'src/libs/theme'
import { applyForAccess } from 'src/utils/accessUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { AssetType, SortOrder, SortState } from 'src/types/library'
import {
  usePiDetails,
  useStudyDatasets,
  useStudyExportableDatasets,
  useStudySelectableDatasetIds,
} from 'src/hooks/useStudyDetailsData'
import { TocProvider, TableOfContents } from 'src/components/study_details/TableOfContents'
import StudyPageSection from 'src/components/study_details/StudyPageSection'
import StudySidebar from 'src/components/study_details/StudySidebar'
import StudyCommentsSection from 'src/components/study_details/StudyCommentsSection'
import StudyDarHistory from 'src/components/study_details/StudyDarHistory'
import StudySecondaryResearchOutputs from 'src/components/study_details/StudySecondaryResearchOutputs'
import StudyTitleBadges from 'src/components/study_details/StudyTitleBadges'
import StudyInfoTable from 'src/components/study_details/StudyInfoTable'
import PiExternalProfileIcons from 'src/components/study_details/PiExternalProfileIcons'
import { getPiProfileLinks } from 'src/components/study_details/piProfileLinks'

const INITIAL_PAGINATION = { page: 0, pageSize: 25 }
const EMPTY_PAGE = {
  items: [],
  total: 0,
  study: undefined,
  participantCount: undefined,
}

type StudySortModel = Array<{ field: string, sort: SortOrder | null }>

/**
 * An index value only when it is actually populated. The index document can exist while carrying
 * '' or [] for a field it never filled, and `??` alone falls through on null/undefined only - so
 * the empty value won and suppressed exactly the relational value the fallback exists to supply.
 * One length check covers both, which a bare `||` would not: an empty array is truthy.
 */
const populated = <T extends string | unknown[]>(value: T | undefined): T | undefined =>
  value === undefined || value.length === 0 ? undefined : value

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
  const { data: piDetails } = usePiDetails(studyId)
  // Dataset search is not a reliable source of study-level metadata: a valid study may have no
  // datasets (and therefore no matching index document). The relational response is already
  // loaded for PI details, so use it as the fallback for the fields both payloads carry.
  const studyName = populated(study?.studyName) ?? piDetails?.name
  const studyDescription = populated(study?.description) ?? piDetails?.description
  const studyDataTypes = populated(study?.dataTypes) ?? piDetails?.dataTypes
  const piName = populated(study?.piName) ?? piDetails?.piName
  const selectedStudyIds = selectedDatasets.length > 0 && study
    ? [study.studyId]
    : []
  const errorMessage = getErrorMessage(error)
  const piProfileLinks = getPiProfileLinks({
    orcid: piDetails?.piOrcid,
    linkedinUrl: piDetails?.piLinkedinUrl,
    websiteUrl: piDetails?.piWebsiteUrl,
  })
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
              {studyName}
            </Typography>
            <StudyTitleBadges dataTypes={studyDataTypes} />
            <Typography variant="body1" sx={{ pt: 2.5 }}>
              {studyDescription}
            </Typography>
            <StudyInfoTable
              rows={[
                { label: 'Participants', value: participantCount },
                { label: 'Phenotype', value: study?.phenotype },
                { label: 'Species', value: study?.species },
                {
                  label: 'PI Name',
                  // The profile links live in this row, and StudyInfoTable drops rows with a
                  // falsy value, so the row's presence can't hinge on piName alone — the search
                  // index sometimes has none for a study whose PI profile links are populated.
                  value: (piName || piProfileLinks.length > 0)
                    ? (
                        <>
                          {piName}
                          <PiExternalProfileIcons links={piProfileLinks} />
                        </>
                      )
                    : undefined,
                },
                { label: 'PI Institution', value: piDetails?.piInstitution?.name },
                { label: 'Data Custodian', value: study?.dataCustodianEmail?.join(', ') },
              ]}
            />
          </StudyPageSection>
          <StudyPageSection id="datasets" heading="Datasets">
            {studyWideIds.isError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Unable to select every controlled dataset automatically. Select datasets manually
                before applying for access.
              </Alert>
            )}
            {/* Deliberately alongside the grid rather than in place of it: the grid renders its
                own empty state, and a reader is better served seeing the table with a message
                above it than a bare line of error text where the table was. */}
            {errorMessage && <Alert severity="error" sx={{ mb: 2 }}>Unable to load datasets: {errorMessage}</Alert>}
            <div style={{ height: datasetGridHeight }}>
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
          <StudyDarHistory studyId={studyId} />
          <StudySecondaryResearchOutputs studyId={studyId} />
          <StudyPageSection id="comments" heading="Comments & Ratings">
            <StudyCommentsSection studyId={studyId} />
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
