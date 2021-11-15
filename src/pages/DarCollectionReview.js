import { useEffect, useState } from 'react';
import { Styles, Theme } from '../libs/theme';
import { div, h, a } from 'react-hyperscript-helpers';
import { Notifications } from '../libs/utils';
import { Collections, User, Navigation } from '../libs/ajax';
import { isEmpty, isNil } from 'lodash';
import ApplicationDownloadLink from '../components/ApplicationDownloadLink';

const isValidCollection = (collection) => {
  return !isEmpty(collection.dars) && !isNil(collection.dars[0].data);
}

const RedirectLink = (user, history) => {
  return a({
    onClick: () => Navigation.console(user, history)
  }, ['Return to Console'])
}


export default function DarCollectionReview(props) {
  const { id } = props.match.params.id;
  const [collection, setCollection] = useState({});
  const [darInfo, setDarInfo] = useState({});
  const [researcherProfile, setResearcherProfile] = useState({});


  useEffect(() => {
    const init = async () => {
      //NOTE: backend is a bit restrictive, collections by id are currently not visible to anyone other than the creator
      //Endpoint needs to be adjusted, for now just remove the check on a local instance
      const [collection, researcherProfile] = await Promise.all([
        Collections.getCollectionById(id),
        User.getMe()
      ]);
      setCollection(collection);
      setDarInfo(collection.dars[0].data);
      setResearcherProfile(researcherProfile);
    }

    try {
      init();
    } catch(error) {
      Notifications.showError({text: 'Failed to initialize collection'});
    }
  }, []);

  return (
    div({style: Styles.PAGE}, [
      div({ isRendered: !isLoading && !isEmpty(darData), styles: { display: "flex" }}, [
        h(CollectionHeader, {
          darCode: collection.darCode,
          projectTitle: collection.data.projectTitle,
          downloadLink: h(ApplicationDownloadLink, {
            darInfo,
            researcherProfile,
            datasets: collection.datasets
          }),
          redirectLink: h(RedirectLink(user, history))
        })
      ])
    ])
  )
}
