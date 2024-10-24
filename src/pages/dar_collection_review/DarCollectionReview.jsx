import React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {Notifications} from '../../libs/utils';
import { User } from '../../libs/ajax/User';
import TabControl from '../../components/TabControl';
import ReviewHeader from './ReviewHeader';
import ApplicationInformation from './ApplicationInformation';
import {find, isEmpty, flatMap, flow, filter, map, get, toLower, uniq, compact} from 'lodash/fp';
import {updateFinalVote} from '../../utils/DarCollectionUtils';
import {binCollectionToBuckets} from '../../utils/BucketUtils';
import { Navigation } from '../../libs/utils';
import { Storage } from '../../libs/storage';
import MultiDatasetVotingTab from './MultiDatasetVotingTab';
import { Collections } from '../../libs/ajax/Collections';
import DataAccessRequestApplication from '../dar_application/DataAccessRequestApplication';

const tabContainerColor = 'rgb(115,154,164)';

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
    borderRadius: '5px 5px 0px 0px'
  },
  tabUnselected: {
    backgroundColor: tabContainerColor,
    color: 'white',
    border: '0px !important',
  },
  tabContainer: {
    backgroundColor: tabContainerColor,
    display: 'flex',
    border: '0px'
  },
};

const tabsForUser = (user, buckets, adminPage = false) => {
  if (adminPage) {
    return {
      applicationInformation: 'Application Information',
      fullDAR: 'Full DAR',
      chairVote: 'Chair Vote'
    };
  }
  const dataAccessBuckets = filter(
    (bucket) => get('isRP')(bucket) !== true
  )(buckets);
  const myMemberVotes = flow(
    flatMap(b => b.votes),
    flatMap(v => v.dataAccess),
    flatMap(da => da.memberVotes),
    filter(v => v.userId === user.userId)
  )(dataAccessBuckets);
  const myChairVotes = flow(
    flatMap(b => b.votes),
    flatMap(v => v.dataAccess),
    flatMap(da => da.chairpersonVotes),
    filter(v => v.userId === user.userId)
  )(dataAccessBuckets);
  const updatedTabs = { applicationInformation: 'Application Information', fullDAR: 'Full DAR' };
  if (!isEmpty(myMemberVotes)) {
    updatedTabs.memberVote = 'Member Vote';
  }
  if (!isEmpty(myChairVotes)) {
    updatedTabs.chairVote = 'Chair Vote';
  }
  return updatedTabs;
};

export default function DarCollectionReview(props) {
  const collectionId = props.match.params.collectionId;
  const [collection, setCollection] = useState({});
  const [darInfo, setDarInfo] = useState({});
  const [referenceIdForDocuments, setReferenceIdForDocuments] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [subcomponentLoading, setSubcomponentLoading] = useState(true);
  const [tabs, setTabs] = useState({
    applicationInformation: 'Application Information',
    fullDAR: 'Full DAR'
  });
  const [selectedTab, setSelectedTab] = useState(tabs.applicationInformation);
  const [researcherProfile, setResearcherProfile] = useState({});
  const [dataUseBuckets, setDataUseBuckets] = useState([]);
  const { adminPage = false, readOnly = false } = props;

  const init = useCallback(async () => {
    const user = Storage.getCurrentUser();
    try {
      const collection = await Collections.getCollectionById(collectionId);
      const darInfo = find((d) => !isEmpty(d.data))(collection.dars).data;
      const referenceIdForDocuments = find((d) => !isEmpty(d.referenceId))(collection.dars).referenceId;
      const researcherProfile = await User.getById(collection.createUserId);
      // If this is NOT an admin view, we need to filter buckets by the user's DACs
      const dacIds = adminPage ? [] : uniq(compact(map(r => r.dacId)(user.roles)));
      const processedBuckets = await binCollectionToBuckets(collection, dacIds);
      setDataUseBuckets(processedBuckets);
      setCollection(collection);
      setDarInfo(darInfo);
      setResearcherProfile(researcherProfile);
      setTabs(tabsForUser(user, processedBuckets, adminPage));
      setIsLoading(false);
      setSubcomponentLoading(false);
      setReferenceIdForDocuments(referenceIdForDocuments);
    } catch (error) {
      Notifications.showError({
        text: 'Error initializing Data Access Request collection page. You have been redirected to your console',
      });
      Navigation.console(user, props.history);
    }
  }, [adminPage, props.history, collectionId]);

  //Remember, votes are contained within buckets, so updating final votes will update the bucket
  //define updateFinalVote as a callback function so that its function definition can be updated alongside dataUseBucket
  const updateFinalVoteFn = useCallback((key, votePayload, voteIds) => {
    return updateFinalVote({key, votePayload, voteIds, dataUseBuckets, setDataUseBuckets});
  }, [dataUseBuckets]);

  useEffect(() => {
    try {
      setIsLoading(true);
      setSubcomponentLoading(true);
      init();
    } catch (error) {
      Notifications.showError({ text: 'Failed to initialize collection' });
    }
  }, [init]);

  useEffect(() => {
    try {
      if (toLower(selectedTab) === 'chair vote') {
        setSubcomponentLoading(true);
        init();
      }
    } catch (error) {
      Notifications.showError({
        text: 'Failed to initialize collection for chair tab',
      });
    }
  }, [selectedTab, init]);

  return (
    <div className="collection-review-page">
      <div className="review-page-header" style={{ width: '90%', margin: '0 auto 3% auto' }}>
        <ReviewHeader
          darCode={collection.darCode || '- -'}
          projectTitle={darInfo.projectTitle || '- -'}
          userName={researcherProfile.displayName || '- -'}
          institutionName={get('institution.name')(researcherProfile) || '- -'}
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
        {selectedTab === tabs.applicationInformation && <ApplicationInformation
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
          signingOfficialEmail={darInfo.signingOfficial} //todo
          itDirectorEmail={darInfo.itDirector} //todo
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
        />}
        {selectedTab === tabs.fullDAR && <DataAccessRequestApplication
          readOnlyMode={true}
          researcherProfile={researcherProfile}
          {...props}
        />}
        {!adminPage && selectedTab === tabs.memberVote && <MultiDatasetVotingTab
          darInfo={darInfo}
          collection={collection}
          buckets={dataUseBuckets}
          isChair={false}
          readOnly={readOnly}
          isLoading={isLoading || subcomponentLoading}
        />}
        {selectedTab === tabs.chairVote && <MultiDatasetVotingTab
          darInfo={darInfo}
          collection={collection}
          buckets={dataUseBuckets}
          isChair={true}
          isLoading={isLoading || subcomponentLoading}
          adminPage={adminPage}
          readOnly={readOnly}
          updateFinalVote={updateFinalVoteFn}
        />}
      </div>
    </div>
  );
}
