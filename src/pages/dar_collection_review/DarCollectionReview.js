import {useCallback, useEffect, useState} from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Notifications } from '../../libs/utils';
import { Collections, User } from '../../libs/ajax';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import TabControl from '../../components/TabControl';
import RedirectLink from '../../components/RedirectLink';
import ReviewHeader from './ReviewHeader';
import ApplicationInformation from './ApplicationInformation';
import { find, isEmpty, flow, filter, map, flatMap, isNil, get } from 'lodash/fp';
import { generatePreProcessedBucketData, processDataUseBuckets } from '../../utils/DarCollectionUtils';
import DataUseVoteSummary from '../../components/common/DataUseVoteSummary/DataUseVoteSummary';
import VotesPieChart from '../../components/common/VotesPieChart';
import { Navigation } from '../../libs/utils';
import { Storage } from '../../libs/storage';
import MultiDatasetVotingTab from "./MultiDatasetVotingTab";
import _ from "lodash";

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
const chairpersonRoleId = 2;
const memberRoleId = 1;

const renderDataUseSubsections = (dataUseBuckets, currentUser) => {
  const buckets = dataUseBuckets.slice(1);
  return buckets.map((bucketData) => {
    const {key, votes} = bucketData;
    const memberVotes = flow(
      map(voteData => voteData.dataAccess),
      filter((dataAccessData) => !isEmpty(dataAccessData)),
      flatMap(filteredData => filteredData.memberVotes)
    )(votes);
    const targetElectionIds = flow(
      filter(vote => vote.dacUserId === currentUser.dacUserId),
      map(vote => vote.electionId)
    )(memberVotes);
    const targetMemberVotes = filter((vote) => {
      const relevantVote = find((id) => vote.electionId === id)(targetElectionIds);
      return !isNil(relevantVote);
    })(memberVotes);
    if(isEmpty(targetMemberVotes)) {
      return div({key: `${key}-no-votes-chart`}, [`No votes for ${key}`]);
    }
    return h(VotesPieChart, {
      votes: targetMemberVotes,
      title: `My DAC Votes - ${key}`,
      keyString: key
    });
  });
};


const userHasRole = (user, roleId) => {
  const roleIds = flow(
    get('roles'),
    map(role => role.roleId)
  )(user);
  const matches = filter(id => id === roleId)(roleIds);
  return !isEmpty(matches);
};

export default function DarCollectionReview(props) {
  const collectionId = props.match.params.collectionId;
  const [collection, setCollection] = useState({});
  const [darInfo, setDarInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [subcomponentLoading, setSubcomponentLoading] = useState(true);
  const [tabs, setTabs] = useState({applicationInformation: 'Application Information'});
  const [selectedTab, setSelectedTab] = useState(tabs.applicationInformation);
  const [currentUser, setCurrentUser] = useState({});
  const [researcherProfile, setResearcherProfile] = useState({});
  const [dataUseBuckets, setDataUseBuckets] = useState([]);
  const [researcherProperties, setResearcherProperties] = useState({});

  const tabsForUserRole = useCallback((user) => {
    const updatedTabs = {applicationInformation: 'Application Information'};

    if(userHasRole(user, chairpersonRoleId)) {
      updatedTabs.memberVote = 'Member Vote';
      updatedTabs.chairVote = 'Chair Vote';
    } else if (userHasRole(user, memberRoleId)) {
      updatedTabs.memberVote = 'Member Vote';
    }
    return updatedTabs;
  }, []);

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
        setTabs(tabsForUserRole(user));
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
  }, [collectionId, props.history, tabsForUserRole]);

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
      h(MultiDatasetVotingTab, {
        isRendered: selectedTab === tabs.memberVote,
        darInfo,
        collection,
        buckets: dataUseBuckets,
        isChair: false,
        isLoading
      }),
      h(MultiDatasetVotingTab, {
        isRendered: selectedTab === tabs.chairVote,
        darInfo,
        collection,
        buckets: dataUseBuckets,
        isChair: true,
        isLoading
      })
      /*NOTE: the function call below is just a placeholder for this PR, in case you want to test it on collections
      I have no intention of using this line as it stands, the grouping/styling of the bucket subsection itself should be done in a later ticket
      However the function itself should be useful as a foundation/initial step if you want to filter votes by DAC membership
      */
      // renderDataUseSubsections(dataUseBuckets, currentUser)
    ])
  ]);
}
