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
  useFrequentlyRequestedWithStudies,
  useSimilarStudies,
  useStudyClinicalTrials,
  useStudyDarTrend,
  useStudyDatasets,
  useStudyExportableDatasets,
  useStudyFundingResources,
  useStudyIntellectualProperty,
  useStudyModels,
  useStudyPresentations,
  useStudyWorkspaces,
} from 'src/hooks/useStudyDetailsData'
import { TocProvider, TableOfContents } from 'src/components/study_details/TableOfContents'
import StudyPageSection from 'src/components/study_details/StudyPageSection'
import StudySidebar from 'src/components/study_details/StudySidebar'
import StudyCommentsSection from 'src/components/study_details/StudyCommentsSection'
import StudyLogoUpload from 'src/components/study_details/StudyLogoUpload'
import StudyAssetCountBadges from 'src/components/study_details/StudyAssetCountBadges'
import StudyTitleBadges from 'src/components/study_details/StudyTitleBadges'
import StudyInfoTable from 'src/components/study_details/StudyInfoTable'
import StudyRecommendationCarousel from 'src/components/study_details/StudyRecommendationCarousel'
import StudyPastDarRequests from 'src/components/study_details/StudyPastDarRequests'
import DarTrendChart from 'src/components/study_details/DarTrendChart'
import StudyAssetTable from 'src/components/study_details/StudyAssetTable'
import { makeModelColumns } from 'src/components/data_library/columns/modelColumns'
import { makeWorkspaceColumns } from 'src/components/data_library/columns/workspaceColumns'
import { makePresentationColumns } from 'src/components/data_library/columns/presentationColumns'
import { makeClinicalTrialColumns } from 'src/components/data_library/columns/clinicalTrialColumns'
import { makeIntellectualPropertyColumns } from 'src/components/data_library/columns/intellectualPropertyColumns'
import { makeFundingResourceColumns } from 'src/components/data_library/columns/fundingResourceColumns'
import {
  ClinicalTrialAsset,
  FundingResourceAsset,
  IntellectualPropertyAsset,
  ModelAsset,
  PresentationAsset,
  WorkspaceAsset,
} from 'src/types/library'

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
  const models = useStudyModels(studyId)
  const workspaces = useStudyWorkspaces(studyId)
  const presentations = useStudyPresentations(studyId)
  const clinicalTrials = useStudyClinicalTrials(studyId)
  const intellectualProperty = useStudyIntellectualProperty(studyId)
  const fundingResources = useStudyFundingResources(studyId)
  const { data: darTrend = [] } = useStudyDarTrend(studyId)
  const similarStudies = useSimilarStudies(studyId)
  const frequentlyRequestedWith = useFrequentlyRequestedWithStudies(studyId)
  const selectedStudyIds = selectedDatasets.length > 0 && study
    ? [study.studyId]
    : []
  const errorMessage = getErrorMessage(error)
  const hasSelectableDatasets = datasets.some(dataset => datasetAsset.isRowSelectable(dataset))
  const theme = useTheme()
  const isNarrowViewport = useMediaQuery(theme.breakpoints.down('md'))

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
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <StudyLogoUpload studyId={studyId} />
              <div>
                <Typography variant="body2" color="text.secondary">
                  <Link to={`/DUOS-S${study?.studyId ?? studyId}`}>
                    DUOS-S{study?.studyId ?? studyId}
                  </Link>
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: Theme.font.weight.semibold, pt: 1 }}>
                  {study?.studyName}
                </Typography>
                <StudyTitleBadges datasets={datasets} />
                <StudyAssetCountBadges studyId={studyId} />
              </div>
            </div>
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
          <TableOfContents />
          <StudyPageSection id="datasets" heading="Datasets">
            {errorMessage && <div role="alert">Unable to load datasets: {errorMessage}</div>}
            <div style={{ height: 600, marginTop: errorMessage ? 20 : 0 }}>
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
                onSelectionChange={setSelectedDatasets}
                exportableDatasets={exportableDatasets}
              />
            </div>
          </StudyPageSection>
          <StudyAssetTable<ModelAsset>
            id="models"
            heading="AI Models"
            data={models.data}
            isFetching={models.isFetching}
            columns={makeModelColumns()}
            getRowId={row => row.modelId}
          />
          <StudyAssetTable<WorkspaceAsset>
            id="workspaces"
            heading="Workspaces"
            data={workspaces.data}
            isFetching={workspaces.isFetching}
            columns={makeWorkspaceColumns()}
            getRowId={row => row.workspaceId}
          />
          <StudyAssetTable<PresentationAsset>
            id="presentations"
            heading="Presentations"
            data={presentations.data}
            isFetching={presentations.isFetching}
            columns={makePresentationColumns()}
            getRowId={row => row.presentationId}
          />
          <StudyAssetTable<ClinicalTrialAsset>
            id="clinical-trials"
            heading="Clinical Trials"
            data={clinicalTrials.data}
            isFetching={clinicalTrials.isFetching}
            columns={makeClinicalTrialColumns()}
            getRowId={row => row.clinicalTrialId}
          />
          <StudyAssetTable<IntellectualPropertyAsset>
            id="intellectual-property"
            heading="Intellectual Property"
            data={intellectualProperty.data}
            isFetching={intellectualProperty.isFetching}
            columns={makeIntellectualPropertyColumns()}
            getRowId={row => row.ipId}
          />
          <StudyAssetTable<FundingResourceAsset>
            id="funding-resources"
            heading="Funding Resources"
            data={fundingResources.data}
            isFetching={fundingResources.isFetching}
            columns={makeFundingResourceColumns()}
            getRowId={row => row.fundingId}
          />
          <StudyPageSection id="dar-trend" heading="Data Access Request Trend">
            <DarTrendChart trend={darTrend} />
          </StudyPageSection>
          <StudyRecommendationCarousel
            id="frequently-requested-with"
            heading="Frequently Requested With"
            recommendations={frequentlyRequestedWith.data}
          />
          <StudyRecommendationCarousel
            id="similar-studies"
            heading="You may also be interested in"
            recommendations={similarStudies.data}
          />
          <StudyPageSection id="comments" heading="Comments & Ratings">
            <StudyCommentsSection studyId={studyId} />
          </StudyPageSection>
        </div>
        {!isNarrowViewport && (
          <StudySidebar
            selectedDatasetIds={selectedDatasets}
            selectedStudyIds={selectedStudyIds}
            onApplyForAccess={() => applyForAccess(selectedDatasets, navigate)}
            hasSelectableDatasets={hasSelectableDatasets}
          >
            <StudyPastDarRequests studyId={studyId} />
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
