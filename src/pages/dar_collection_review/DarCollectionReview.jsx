import React, { useCallback, useEffect, useState } from 'react'
import { User } from '../../libs/ajax/User'
import TabControl from '../../components/TabControl'
import ReviewHeader from './ReviewHeader'
import ApplicationInformation from './ApplicationInformation'
import { isEmpty, flatMap, flow, filter, map, get, toLower, uniq, compact } from 'lodash/fp'
import { updateFinalVote } from '../../utils/DarCollectionUtils'
import { binCollectionToBuckets } from '../../utils/BucketUtils'
import { Notifications, Navigation } from '../../libs/utils'
import { Storage } from '../../libs/storage'
import MultiDatasetVotingTab from './MultiDatasetVotingTab'
import { Collections } from '../../libs/ajax/Collections'
import DataAccessRequestApplication from '../dar_application/DataAccessRequestApplication'
import VotingHistory from './VotingHistory'
import { APPROVED_VOTETYPES, ElectionStatus, ElectionType } from 'src/utils/DarUtils'

const tabContainerColor = 'rgb(115,154,164)'

const tabStyleOverride = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    width: 'fit-content',
    fontWeight: 600,
    border: '0px',
    display: 'flex',
    justifyContent: 'center',
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
    border: '0px',
  },
}

const tabsForUser = (user, buckets, adminPage = false) => {
  if (adminPage) {
    return {
      applicationInformation: 'Application Information',
      fullDAR: 'Full DAR',
      chairVote: 'Chair Vote',
      votingHistory: 'Voting History',
    }
  }
  const dataAccessBuckets = filter(
    bucket => get('isRP')(bucket) !== true,
  )(buckets)
  const myMemberVotes = flow(
    flatMap(b => b.votes),
    flatMap(v => v.dataAccess),
    flatMap(da => da.memberVotes),
    filter(v => v.userId === user.userId),
  )(dataAccessBuckets)
  const myChairVotes = flow(
    flatMap(b => b.votes),
    flatMap(v => v.dataAccess),
    flatMap(da => da.chairpersonVotes),
    filter(v => v.userId === user.userId),
  )(dataAccessBuckets)
  const updatedTabs = { applicationInformation: 'Application Information', fullDAR: 'Full DAR' }
  if (!isEmpty(myMemberVotes)) {
    updatedTabs.memberVote = 'Member Vote'
  }
  if (!isEmpty(myChairVotes)) {
    updatedTabs.chairVote = 'Chair Vote'
  }
  if (userIsDacUser(user)) {
    updatedTabs.votingHistory = 'Voting History'
  }
  return updatedTabs
}

const getApprovedDatasetsFromLatestDar = (darCollection, dacIds) => {
  const getMostRecentSubmittedDar = (darCollection) => {
    const dars = Object.values(darCollection.dars || {})
    const submittedDars = dars.filter(d => !d.draft)
    if (submittedDars.length === 0) return submittedDars
    return submittedDars.reduce((latest, current) =>
      new Date(current.submissionDate) > new Date(latest.submissionDate) ? current : latest,
    )
  }

  const getClosedDataAccessElections = (mostRecentDar) => {
    const elections = Object.values(mostRecentDar.elections || {})
    return elections.filter(
      e => e.electionType === ElectionType.DATA_ACCESS && e.status === ElectionStatus.CLOSED,
    )
  }

  const getApprovedDatasetIdFromElection = (election) => {
    const electionVotes = Object.values(election.votes || {})
    const hasApprovedVote = electionVotes.some(
      vote => vote.vote === true && APPROVED_VOTETYPES.includes(vote.type),
    )
    if (hasApprovedVote) {
      return election.datasetId
    }
    return null
  }

  const getApprovedDatasetNames = (darCollection, approvedDatasetIdsSet, dacIds) => {
    return Array.from(approvedDatasetIdsSet)
      .filter((datasetId) => {
        if (dacIds.length === 0) return true // admin page
        const dataset = darCollection.datasets?.find(ds => ds.datasetId === datasetId)
        return dacIds.includes(dataset?.dacId)
      })
      .map((datasetId) => {
        const dataset = darCollection.datasets?.find(ds => ds.datasetId === datasetId)
        return dataset?.name
      }) || []
  }

  const mostRecentDar = getMostRecentSubmittedDar(darCollection)
  const darElections = getClosedDataAccessElections(mostRecentDar)
  const approvedDatasetIdsSet = new Set()

  // Loop through elections and collect approved dataset IDs
  darElections.forEach((darElection) => {
    const approvedDatasetId = getApprovedDatasetIdFromElection(darElection)
    if (approvedDatasetId) {
      approvedDatasetIdsSet.add(approvedDatasetId)
    }
  })

  return getApprovedDatasetNames(darCollection, approvedDatasetIdsSet, dacIds)
}

const userIsDacUser = (user) => {
  return user.roles?.some(role => role.roleId === 2 || role.roleId === 1)
}

export default function DarCollectionReview(props) {
  const collectionId = props.match.params.collectionId
  const [collection, setCollection] = useState({})
  const [darInfo, setDarInfo] = useState({})
  const [referenceIdForDocuments, setReferenceIdForDocuments] = useState()
  const [approvedDatasets, setApprovedDatasets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [subcomponentLoading, setSubcomponentLoading] = useState(true)
  const [tabs, setTabs] = useState({
    applicationInformation: 'Application Information',
    fullDAR: 'Full DAR',
  })
  const [selectedTab, setSelectedTab] = useState(tabs.applicationInformation)
  const [researcherProfile, setResearcherProfile] = useState({})
  const [dataUseBuckets, setDataUseBuckets] = useState([])
  const [dacIds, setDacIds] = useState([])
  const { adminPage = false, readOnly = false } = props

  const init = useCallback(async () => {
    const user = Storage.getCurrentUser()
    try {
      let collection
      if (adminPage || userIsDacUser(user)) {
        collection = await Collections.getCollectionByIdWithElectionHistory(collectionId)
      }
      else {
        collection = await Collections.getCollectionById(collectionId)
      }

      // Find darInfo and referenceIdForDocuments in one pass
      let darInfo, referenceIdForDocuments
      for (const d of Object.values(collection.dars)) {
        if (!darInfo && !isEmpty(d.data)) darInfo = d.data
        if (!referenceIdForDocuments && !isEmpty(d.referenceId)) referenceIdForDocuments = d.referenceId
        if (darInfo && referenceIdForDocuments) break
      }

      // If this is NOT an admin view, we need to filter buckets by the user's DACs
      const dacIds = adminPage ? [] : uniq(compact(map(r => r.dacId)(user.roles)))

      // Parallelize async calls
      const [researcherProfile, processedBuckets] = await Promise.all([
        User.getById(collection.createUserId),
        binCollectionToBuckets(collection, dacIds),
      ])

      const approvedDatasetNames = getApprovedDatasetsFromLatestDar(collection || { dars: [] }, dacIds)

      setDataUseBuckets(processedBuckets)
      setCollection(collection)
      setDarInfo(darInfo)
      setResearcherProfile(researcherProfile)
      setApprovedDatasets(approvedDatasetNames)
      setTabs(tabsForUser(user, processedBuckets, adminPage))
      setDacIds(dacIds)
      setIsLoading(false)
      setSubcomponentLoading(false)
      setReferenceIdForDocuments(referenceIdForDocuments)
    }
    catch (_error) {
      Notifications.showError({
        text: 'Error initializing Data Access Request collection page. You have been redirected to your console',
      })
      await Navigation.console(user, props.history)
    }
  }, [adminPage, props.history, collectionId])

  // Remember, votes are contained within buckets, so updating final votes will update the bucket
  // define updateFinalVote as a callback function so that its function definition can be updated alongside dataUseBucket
  const updateFinalVoteFn = useCallback((key, votePayload, voteIds) => {
    return updateFinalVote({ key, votePayload, voteIds, dataUseBuckets, setDataUseBuckets })
  }, [dataUseBuckets])

  useEffect(() => {
    try {
      setIsLoading(true)
      setSubcomponentLoading(true)
      init()
    }
    catch (_error) {
      Notifications.showError({ text: 'Failed to initialize collection' })
    }
  }, [init])

  useEffect(() => {
    try {
      if (toLower(selectedTab) === 'chair vote') {
        setSubcomponentLoading(true)
        init()
      }
    }
    catch (_error) {
      Notifications.showError({
        text: 'Failed to initialize collection for chair tab',
      })
    }
  }, [selectedTab, init])

  return (
    <div className="collection-review-page">
      <div className="review-page-header" style={{ width: '90%', margin: '0 auto 3% auto' }}>
        <ReviewHeader
          darCode={collection.darCode || '- -'}
          projectTitle={darInfo.projectTitle || '- -'}
          userName={researcherProfile.displayName || '- -'}
          institutionName={get('institution.name')(researcherProfile) || '- -'}
          approvedDatasets={approvedDatasets}
          isLoading={isLoading}
          readOnly={readOnly || adminPage}
        />
      </div>
      <div className="review-page-body" style={{ padding: '1% 0% 0% 5.1%', backgroundColor: tabContainerColor }}>
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
            institution={get('institution.name')(researcherProfile)}
            researcher={researcherProfile.displayName}
            email={researcherProfile.email}
            nonTechSummary={darInfo.nonTechRus}
            isLoading={subcomponentLoading}
            collection={collection}
            dataUseBuckets={dataUseBuckets}
            externalCollaborators={darInfo.externalCollaborators}
            internalCollaborators={darInfo.internalCollaborators}
            signingOfficial={darInfo.signingOfficial}
            itDirector={darInfo.itDirector}
            signingOfficialEmail={darInfo.signingOfficial} // todo
            itDirectorEmail={darInfo.itDirector} // todo
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
            researcherProfile={researcherProfile}
            collection={collection}
            {...props}
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
            darCollection={collection}
            dacIds={dacIds}
          />
        )}
      </div>
    </div>
  )
}
