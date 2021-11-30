import { useEffect, useState } from 'react';
import { Styles, Theme } from '../../libs/theme';
import { div, h } from 'react-hyperscript-helpers';
import { Notifications } from '../../libs/utils';
import { Collections, User } from '../../libs/ajax';
import { isEmpty, isNil } from 'lodash';
import ApplicationDownloadLink from '../../components/ApplicationDownloadLink';
import TabControl from '../../components/TabControl';
import RedirectLink from '../../components/RedirectLink';
import ReviewHeader from './ReviewHeader';

//NOTE: may not need this
const isValidCollection = (collection) => {
  return !isEmpty(collection.dars) && !isNil(collection.dars[0].data);
};

export default function DarCollectionReview(props) {
  const tabs = {
    applicationInformation: 'Application Information',
    researchProposal: 'Research Proposal'
  };

  const collectionId = props.match.params.collectionId;
  const [collection, setCollection] = useState({});
  const [darInfo, setDarInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(tabs.applicationInformation);
  const [currentUser, setCurrentUser] = useState({});
  const [researcherProfile, setResearcherProfile] = useState({});

  //NOTE: update isLoading flow if needed. Will create skeleton loaders for individual pieces later
  useEffect(() => {
    const init = async () => {
      //NOTE: backend is a bit restrictive, collections by id are currently not visible to anyone other than the creator
      //Endpoint needs to be adjusted, for now just remove the check on a local instance
      const [collection, user] = await Promise.all([
        Collections.getCollectionById(collectionId),
        User.getMe()
      ]);
      const darInfo = collection.dars[0].data;
      const researcherProfile =  await User.getById(collection.createUserId);
      setCollection(collection);
      setCurrentUser(user);
      setDarInfo(darInfo);
      setResearcherProfile(researcherProfile);
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
        h(TabControl, {
          //don't use lodash map, iteration order isn't guaranteed
          labels: [tabs.applicationInformation, tabs.researchProposal],
          selectedTab,
          setSelectedTab,
          isLoading
        })
      ])
    ])
  );
}
