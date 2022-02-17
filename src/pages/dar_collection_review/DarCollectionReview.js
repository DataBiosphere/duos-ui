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
import { Navigation } from '../../libs/utils';
import { Storage } from '../../libs/storage';

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
  const [researcherProperties, setResearcherProperties] = useState({});

  useEffect(() => {
    const init = async () => {
      const user = Storage.getCurrentUser();
      try {
        const collection = await Collections.getCollectionById(collectionId);
        const { dars, datasets } = collection;
        const darInfo = find((d) => !isEmpty(d.data))(collection.dars).data;
        const researcherProfile = await User.getById(collection.createUserId);
        const researcherProperties = {};
        researcherProfile.researcherProperties.forEach((property) => {
          const { propertyKey, propertyValue } = property;
          researcherProperties[propertyKey] = propertyValue;
        });
        const processedBuckets = await flow([
          generatePreProcessedBucketData,
          processDataUseBuckets,
        ])({ dars, datasets });
        setResearcherProperties(researcherProperties);
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
      } catch(error) {
        Notifications.showError({text: 'Error initializing DAR collection page. You have been redirected to your console'});
        Navigation.console(user, props.history);
      }
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

  return div({className: 'collection-review-page'}, [
    div({className: 'review-page-header', style: { width: '90%', margin: '0 auto' }}, [
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
        pi: researcherProperties.isThePI ? researcherProperties.profileName : researcherProperties.piName,
        institution: researcherProperties.institution,
        researcher: researcherProperties.profileName,
        email: researcherProperties.academicEmail,
        piEmail: researcherProperties.isThePI ? researcherProperties.academicEmail : researcherProperties.piEmail,
        city: `${researcherProperties.city}${!researcherProperties.state ? '' : ', ' + researcherProperties.state}`,
        country: researcherProperties.country,
        nonTechSummary: darInfo.nonTechRus,
        department: researcherProperties.department,
        isLoading: subcomponentLoading,
        collection: collection,
        dataUseBuckets: dataUseBuckets,
        externalCollaborators: darInfo.externalCollaborators,
        internalCollaborators: darInfo.internalCollaborators,
        signingOfficial: darInfo.signingOfficial,
        itDirector: darInfo.itDirector,
        signingOfficialEmail: darInfo.signingOfficial, //todo
        itDirectorEmail: darInfo.itDirector, //todo
        internalLabStaff: darInfo.labCollaborators,
        anvilStorage: darInfo.anvilUse,
        localComputing: darInfo.localUse,
        cloudComputing: darInfo.cloudUse,
        cloudProvider: darInfo.cloudProvider,
        cloudProviderDescription: darInfo.cloudProviderDescription
      }),
    ])
  ]);
}
