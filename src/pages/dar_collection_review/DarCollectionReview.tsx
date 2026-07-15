import React, { useCallback, useEffect, useState } from 'react'
import { User } from 'src/libs/ajax/User'
import TabControl from 'src/components/TabControl'
import { type TabStyleOverride } from 'src/components/SelectableText'
import ReviewHeader from './ReviewHeader'
import ApplicationInformation from './ApplicationInformation'
import { compact, get, isEmpty, map, toLower, uniq } from 'src/utils/NodashUtil'
import { updateFinalVote } from 'src/utils/DarCollectionUtils'
import { binCollectionToBuckets, Bucket } from 'src/utils/BucketUtils'
import { Navigation, Notifications } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import MultiDatasetVotingTab from './MultiDatasetVotingTab'
import { Collections } from 'src/libs/ajax/Collections'
import DataAccessRequestApplication from '../dar_application/DataAccessRequestApplication'
import VotingHistory from './VotingHistory'
import AILLMWarningBanner from 'src/components/AILLMWarningBanner'
import { APPROVED_VOTETYPES, ElectionStatus, ElectionType, userHasOpenDataAccessElection } from 'src/utils/DarUtils'
import { extractError } from 'src/utils/ErrorUtils.js'
import { Notification } from 'src/components/Notification.jsx'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { DarCollection, DuosUser, DataAccessRequestData } from 'src/types/model'

interface DarCollectionReviewProps {
  adminPage?: boolean
  readOnly?: boolean
}

const tabContainerColor = 'rgb(115,154,164)'

const tabStyleOverride: TabStyleOverride = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: 'clamp(1.2rem, 2vw, 1.6rem)',
    width: 'fit-content',
    fontWeight: 600,
    border: '0px',
    display: 'flex',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    padding: '1%',
  },
  tabSelected: {
    backgroundColor: 'white',
    color: tabContainerColor,
    border: '0px black solid !important',
    borderRadius: '5px 5px 0px 0px',
  },
  tabUnselected: {
    backgroundColor: tabContainerColor,
    color: 'white',
    border: '0px !important',
  },
  tabContainer: {
    backgroundColor: tabContainerColor,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
    border: '0px',
  },
}

const tabsForUser = (user: DuosUser, buckets: Bucket[], adminPage = false): Record<string, string> => {
  if (adminPage) {
    return {
      applicationInformation: 'Application Information',
      fullDAR: 'Full DAR',
      chairVote: 'Chair Vote',
      votingHistory: 'Voting History',
    }
  }
  const allVoteRecords = buckets.flatMap(b => b.votes)
  const myMemberVotes = allVoteRecords
    .map(vr => vr['dataAccess'])
    .flatMap(vg => vg.memberVotes)
    .filter(v => v.userId === user.userId)
  const myChairVotes = allVoteRecords
    .map(vr => vr['dataAccess'])
    .flatMap(vg => vg.chairpersonVotes)
    .filter(v => v.userId === user.userId)
  const updatedTabs: Record<string, string> = { applicationInformation: 'Application Information', fullDAR: 'Full DAR' }
  if (!isEmpty(myMemberVotes)) {
    updatedTabs.memberVote = 'Vote'
  }
  // Only show a standalone Chair Vote tab when the user has no member votes;
  // when both exist, chair voting is folded into the Member Vote tab.
  if (!isEmpty(myChairVotes) && isEmpty(myMemberVotes)) {
    updatedTabs.chairVote = 'Chair Vote'
  }
  if (userIsDacUser(user)) {
    updatedTabs.votingHistory = 'Voting History'
  }
  return updatedTabs
}

const getApprovedDatasetsFromLatestDar = (darCollection: DarCollection, dacIds: number[]): string[] => {
  const getMostRecentSubmittedDar = (darCollection: DarCollection) => {
    const dars = Object.values(darCollection.dars || {})
    const submittedDars = dars.filter(d => !d.draft)
    if (submittedDars.length === 0) return submittedDars[0]
    return submittedDars.reduce((latest, current) =>
      new Date(current.submissionDate ?? 0) > new Date(latest.submissionDate ?? 0) ? current : latest,
    submittedDars[0])
  }

  const getClosedDataAccessElections = (mostRecentDar: ReturnType<typeof getMostRecentSubmittedDar>) => {
    if (!mostRecentDar) return []
    const elections = Object.values(mostRecentDar.elections || {})
    return elections.filter(
      e => e.electionType === ElectionType.DATA_ACCESS && e.status === ElectionStatus.CLOSED,
    )
  }

  const getApprovedDatasetIdFromElection = (election: ReturnType<typeof getClosedDataAccessElections>[number]) => {
    const electionVotes = Object.values(election.votes || {})
    const hasApprovedVote = electionVotes.some(
      vote => vote.vote === true && APPROVED_VOTETYPES.includes(vote.type ?? ''),
    )
    if (hasApprovedVote) {
      return election.datasetId
    }
    return null
  }

  const getApprovedDatasetNames = (darCollection: DarCollection, approvedDatasetIdsSet: Set<number>, dacIds: number[]): string[] => {
    return Array.from(approvedDatasetIdsSet)
      .filter((datasetId) => {
        if (dacIds.length === 0) return true // admin page
        const dataset = darCollection.datasets?.find(ds => ds.datasetId === datasetId)
        return dacIds.includes(dataset?.dacId ?? -1)
      })
      .map((datasetId) => {
        const dataset = darCollection.datasets?.find(ds => ds.datasetId === datasetId)
        return dataset?.name ?? ''
      })
  }

  const mostRecentDar = getMostRecentSubmittedDar(darCollection)
  const darElections = getClosedDataAccessElections(mostRecentDar)
  const approvedDatasetIdsSet = new Set<number>()

  darElections.forEach((darElection) => {
    const approvedDatasetId = getApprovedDatasetIdFromElection(darElection)
    if (approvedDatasetId) {
      approvedDatasetIdsSet.add(approvedDatasetId)
    }
  })

  return getApprovedDatasetNames(darCollection, approvedDatasetIdsSet, dacIds)
}

const userIsDacUser = (user: DuosUser): boolean => {
  return user.roles?.some(role => role.roleId === 2 || role.roleId === 1) ?? false
}

export default function DarCollectionReview({ adminPage = false, readOnly = false }: Readonly<DarCollectionReviewProps>) {
  usePageTitle('DAR Review')
  const params = useParams()
  const collectionId = Number(params.collectionId)
  const navigate = useNavigate()
  const [collection, setCollection] = useState<DarCollection | Record<string, never>>({})
  const [collectionWithHistory, setCollectionWithHistory] = useState<DarCollection | Record<string, never>>({})
  const [darInfo, setDarInfo] = useState<Partial<DataAccessRequestData>>({})
  const [referenceIdForDocuments, setReferenceIdForDocuments] = useState<string | undefined>()
  const [approvedDatasets, setApprovedDatasets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subcomponentLoading, setSubcomponentLoading] = useState(true)
  const [tabs, setTabs] = useState<Record<string, string>>({
    applicationInformation: 'Application Information',
    fullDAR: 'Full DAR',
  })
  const [selectedTab, setSelectedTab] = useState(tabs.applicationInformation)
  const [researcherProfile, setResearcherProfile] = useState<DuosUser | Record<string, never>>({})
  const [dataUseBuckets, setDataUseBuckets] = useState<Bucket[]>([])
  const [dacIds, setDacIds] = useState<number[]>([])
  const [canVote, setCanVote] = useState<boolean | undefined>(undefined)

  const init = useCallback(async () => {
    const user = Storage.getCurrentUser()
    try {
      const collection = await Collections.getCollectionById(collectionId)
      if (adminPage || userIsDacUser(user)) {
        setCollectionWithHistory(await Collections.getCollectionByIdWithElectionHistory(collectionId))
      }

      // Find darInfo and referenceIdForDocuments in one pass
      let darInfo: Partial<DataAccessRequestData> | undefined
      let referenceIdForDocuments: string | undefined
      for (const d of Object.values(collection.dars)) {
        if (!darInfo && !isEmpty(d.data)) darInfo = d.data
        if (!referenceIdForDocuments && !isEmpty(d.referenceId)) referenceIdForDocuments = d.referenceId
        if (darInfo && referenceIdForDocuments) break
      }

      // If this is NOT an admin view, we need to filter buckets by the user's DACs
      const dacIds: number[] = adminPage ? [] : uniq(compact(map(user.roles, r => r.dacId)))

      // Parallelize async calls
      const [researcherProfile, processedBuckets] = await Promise.all([
        User.getById(collection.createUserId),
        binCollectionToBuckets(collection, dacIds),
      ])

      const approvedDatasetNames = getApprovedDatasetsFromLatestDar(collection || { dars: {} } as DarCollection, dacIds)

      setDataUseBuckets(processedBuckets)
      setCollection(collection)
      setDarInfo(darInfo ?? {})
      setResearcherProfile(researcherProfile)
      setApprovedDatasets(approvedDatasetNames)
      setTabs(tabsForUser(user, processedBuckets, adminPage))
      setDacIds(dacIds)
      setIsLoading(false)
      setSubcomponentLoading(false)
      setReferenceIdForDocuments(referenceIdForDocuments)
      setCanVote(userHasOpenDataAccessElection(collection, user.userId))
    }
    catch {
      Notifications.showError({
        text: 'Error initializing Data Access Request collection page. You have been redirected to your console',
      })
      await Navigation.console(user, navigate)
    }
  }, [adminPage, navigate, collectionId])

  // Votes are grouped into buckets (by DataUse), so applying a final vote will update all votes in the  bucket.
  // Define updateFinalVote as a callback function so that its function definition can be updated alongside dataUseBucket
  const updateFinalVoteFn = useCallback((key: string, votePayload: Record<string, unknown>, voteIds: number[]) => {
    return updateFinalVote({ key, votePayload, voteIds, dataUseBuckets, setDataUseBuckets })
  }, [dataUseBuckets])

  useEffect(() => {
    try {
      // Intentionally setting loading state at effect start.
      // oxlint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(true)
      setSubcomponentLoading(true)
      init()
    }
    catch (error) {
      const message = extractError(error)
      Notifications.showError({ text: 'Failed to initialize collection: ' + message })
    }
  }, [init])

  useEffect(() => {
    try {
      if (toLower(selectedTab) === 'chair vote') {
        // Intentionally setting loading state when switching tabs.
        // oxlint-disable-next-line react-hooks/set-state-in-effect
        setSubcomponentLoading(true)
        init()
      }
    }
    catch {
      Notifications.showError({
        text: 'Failed to initialize collection for chair tab',
      })
    }
  }, [selectedTab, init])

  return (
    <div className="collection-review-page">
      <div className="review-page-header" style={{ width: 'min(100%, 120rem)', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        <ReviewHeader
          darCode={get(collection, 'darCode') || '- -'}
          projectTitle={get(darInfo, 'projectTitle') || '- -'}
          userName={get(researcherProfile, 'displayName') || '- -'}
          institutionName={get(researcherProfile, 'institution.name') || '- -'}
          approvedDatasets={approvedDatasets}
          isLoading={isLoading}
          readOnly={readOnly || adminPage}
        />
        <AILLMWarningBanner darInfo={darInfo} />
        {canVote === false && (
          <Notification
            customStyle={{ paddingLeft: 0 }}
            notificationData={{
              message: 'This vote page is read-only. Click vote on the DAR table entry or look at the voting history tab for details.',
            }}
          />
        )}
      </div>
      <div className="review-page-body" style={{ marginTop: '1rem', padding: '1rem clamp(0.8rem, 2.5vw, 2.2rem) 0', backgroundColor: tabContainerColor }}>
        <TabControl
          labels={Object.values(tabs)}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isLoading={isLoading}
          styleOverride={tabStyleOverride}
          isDisabled={isLoading || subcomponentLoading}
        />
        {selectedTab === tabs.applicationInformation && (
          <ApplicationInformation
            institution={get(researcherProfile, 'institution.name')}
            researcher={get(researcherProfile, 'displayName')}
            email={get(researcherProfile, 'email')}
            nonTechSummary={darInfo.nonTechRus}
            isLoading={subcomponentLoading}
            collection={collection}
            dataUseBuckets={dataUseBuckets}
            externalCollaborators={darInfo.externalCollaborators}
            internalCollaborators={darInfo.internalCollaborators}
            signingOfficialName={darInfo.signingOfficial}
            signingOfficialEmail={darInfo.signingOfficialEmail}
            researcherInstitutionId={get(researcherProfile, 'institutionId')}
            itDirectorEmail={darInfo.itDirector}
            internalLabStaff={darInfo.labCollaborators}
            anvilStorage={darInfo.anvilUse}
            localComputing={darInfo.localUse}
            cloudComputing={darInfo.cloudUse}
            cloudProvider={darInfo.cloudProvider}
            cloudProviderDescription={darInfo.cloudProviderDescription}
            rus={darInfo.rus}
            referenceId={referenceIdForDocuments}
            irbDocumentLocation={darInfo.irbDocumentLocation}
            collaborationLetterLocation={darInfo.collaborationLetterLocation}
            irbDocumentName={darInfo.irbDocumentName}
            collaborationLetterName={darInfo.collaborationLetterName}
          />
        )}
        {selectedTab === tabs.fullDAR && (
          <DataAccessRequestApplication
            existingDarsReadOnlyMode={true}
            draftDar={false}
            isProgressReportApplication={false}
            collection={collection}
          />
        )}
        {!adminPage && selectedTab === tabs.memberVote && (
          <MultiDatasetVotingTab
            darInfo={darInfo}
            collection={collection}
            buckets={dataUseBuckets}
            isChair={false}
            readOnly={readOnly}
            isLoading={isLoading || subcomponentLoading}
            updateFinalVote={updateFinalVoteFn}
            reloadFn={init}
          />
        )}
        {selectedTab === tabs.chairVote && (
          <MultiDatasetVotingTab
            darInfo={darInfo}
            collection={collection}
            buckets={dataUseBuckets}
            isChair={true}
            isLoading={isLoading || subcomponentLoading}
            adminPage={adminPage}
            readOnly={readOnly}
            updateFinalVote={updateFinalVoteFn}
            reloadFn={init}
          />
        )}
        {selectedTab === tabs.votingHistory && (
          <VotingHistory
            darCollection={collectionWithHistory as DarCollection}
            dacIds={dacIds}
          />
        )}
      </div>
    </div>
  )
}
