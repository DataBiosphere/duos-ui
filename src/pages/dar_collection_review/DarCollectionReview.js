import { useEffect, useState } from 'react';
import { Styles } from '../../libs/theme';
import { div, h } from 'react-hyperscript-helpers';
import { Notifications } from '../../libs/utils';
import { Collections, User } from '../../libs/ajax';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import TabControl from '../../components/TabControl';
import RedirectLink from '../../components/RedirectLink';
import ReviewHeader from './ReviewHeader';
import ApplicationInformation from './ApplicationInformation';
import { find, isEmpty, flow } from 'lodash/fp';
import { generatePreProcessedBucketData, processDataUseBuckets } from '../../utils/DarCollectionUtils';
import DataUseVoteSummary from '../../components/common/DataUseVoteSummary';

export default function DarCollectionReview(props) {
  const tabs = {
    applicationInformation: 'Application Information',
    researchProposal: 'Research Proposal'
  };

  const collectionId = props.match.params.collectionId;
  const [collection, setCollection] = useState({});
  const [darInfo, setDarInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [subcomponentLoading, setSubcomponentLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(tabs.applicationInformation);
  const [currentUser, setCurrentUser] = useState({});
  const [researcherProfile, setResearcherProfile] = useState({});
  const [dataUseBuckets, setDataUseBuckets] = useState([]);

  useEffect(() => {
    const init = async () => {
      //NOTE: backend is a bit restrictive, collections by id are currently not visible to anyone other than the creator
      //Endpoint needs to be adjusted, for now just remove the check on a local instance
      const [collection, user] = await Promise.all([
        Collections.getCollectionById(collectionId),
        User.getMe()
      ]);
      const {dars, datasets} = collection;
      const darInfo = find((d) => !isEmpty(d.data))(collection.dars).data;
      const researcherProfile =  await User.getById(collection.createUserId);
      const processedBuckets = await flow([
        generatePreProcessedBucketData,
        processDataUseBuckets
      ])({ dars, datasets });
      setDataUseBuckets(processedBuckets);
      setCollection(collection);
      setCurrentUser(user);
      setDarInfo(darInfo);
      setResearcherProfile(researcherProfile);
      //setTimeout used to render skeleton loader while sub-components are initializing data for render
      const timeout = setTimeout(() => {
        setIsLoading(false);
        clearTimeout(timeout);
      }, 500);
    };

    try {
      setIsLoading(true);
      init();
    } catch(error) {
      Notifications.showError({text: 'Failed to initialize collection'});
    }
  }, [collectionId]);

  useEffect(() => {
    setSubcomponentLoading(true);
  }, [selectedTab]);

  useEffect(() => {
    if(subcomponentLoading && !isLoading) {
      const timeout = setTimeout(() => {
        setSubcomponentLoading(false);
        clearTimeout(timeout);
      }, 500);
    }
  }, [subcomponentLoading, isLoading]);

  return (
    div({style: Styles.PAGE}, [
      div({}, [
        h(ReviewHeader, {
          darCode: collection.darCode || '- -',
          projectTitle: darInfo.projectTitle || '- -',
          downloadLink: h(ApplicationDownloadLink, {
            darInfo,
            researcherProfile,
            datasets: collection.datasets || []
          }),
          isLoading,
          redirectLink: h(RedirectLink, {user: currentUser, history: props.history})
        }),
        h(DataUseVoteSummary, {dataUseBuckets}),
        h(TabControl, {
          labels: [tabs.applicationInformation, tabs.researchProposal],
          selectedTab,
          setSelectedTab,
          isLoading
        }),
        h(ApplicationInformation, {
          isRendered: selectedTab === tabs.applicationInformation,
          pi: darInfo.isThePi ? darInfo.researcher : darInfo.investigator,
          institution: darInfo.institution,
          researcher: darInfo.researcher,
          email: darInfo.academicEmail,
          piEmail: darInfo.piEmail,
          city: `${darInfo.city}${!darInfo.state ? '' : ', ' + darInfo.state}`,
          country: darInfo.country,
          nonTechSummary: darInfo.nonTechRus,
          department: darInfo.department,
          isLoading: subcomponentLoading
        })
      ])
    ])
  );
}
