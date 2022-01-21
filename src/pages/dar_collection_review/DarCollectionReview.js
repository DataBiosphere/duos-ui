import { useEffect, useState } from 'react';
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
import DataUseVoteSummary from '../../components/common/DataUseVoteSummary/DataUseVoteSummary';

const tabContainerColor = 'rgb(115,154,164)';

const tabStyleOverride = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '2rem',
    width: '16%',
    fontWeight: 600,
    border: '0px',
    display: 'flex',
    justifyContent: 'center',
    padding: '0.5%',
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

export default function DarCollectionReview(props) {
  const tabs = {
    applicationInformation: 'Application Information'
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

  //PAGE -> {width: 90%, margin: 0 auto}
  return div({className: 'collection-review-page'}, [ //TODO: remove this styling from this container
    div({className: 'review-page-header', style: { width: '90%', margin: '0 auto' }}, [ //TODO: make this the parent container of reviewheader and votesummary, apply the page margin style here
      h(ReviewHeader, {
        darCode: collection.darCode || '- -',
        projectTitle: darInfo.projectTitle || '- -',
        downloadLink: h(ApplicationDownloadLink, {
          darInfo,
          researcherProfile,
          datasets: collection.datasets || [],
        }),
        isLoading,
        redirectLink: h(RedirectLink, {
          user: currentUser,
          history: props.history,
        }),
      }),
      h(DataUseVoteSummary, { dataUseBuckets, isLoading }),
    ]),
    div({ className: 'review-page-body', style: {padding: '1% 0% 0% 10%', backgroundColor: tabContainerColor} }, [ //TODO: take the margin measurements and apply as padding here
      h(TabControl, {
        labels: Object.values(tabs),
        selectedTab,
        setSelectedTab,
        isLoading,
        styleOverride: tabStyleOverride
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
        isLoading: subcomponentLoading,
      }),
    ]),
    // ]),
  ]);
}
