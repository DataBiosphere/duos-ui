import {useEffect, useState} from 'react';
import {div} from 'react-hyperscript-helpers';
import {AccessReviewHeader} from './access_review/AccessReviewHeader';
import {Election} from '../libs/ajax';
import {getDarData, Notifications} from '../libs/utils';
import {isNil} from 'lodash/fp';
import {DarApplication} from "./access_review/DarApplication";

const SECTION = {
  margin: '20px',
};

export default function ReviewResults(props) {
  const [match] = useState(props.match);
  const [darId] = useState(props.match.params.referenceId);
  const [datasets, setDatasets] = useState();
  const [darInfo, setDarInfo] = useState();
  const [consent, setConsent] = useState();
  const [researcherProfile, setResearcherProfile] = useState();
  const [accessElection, setAccessElection] = useState();
  const [accessElectionReview, setAccessElectionReview] = useState();
  const [rpElectionReview, setRpElectionReview] = useState();
  const [voteAsChair] = useState(true);

  useEffect(() => {
    let darData;
    let electionData;

    const getData = async (darId) => {
      [darData, electionData] = await Promise.all([
        setDarData(darId),
        getElectionInformation(darId)
      ]);
    }

    getData(darId);

  }, [darId]);

  const setDarData = async (darId) => {
    const {datasets, darInfo, consent, researcherProfile} = await getDarData(darId);
    setDarInfo(darInfo);
    setConsent(consent);
    setDatasets(datasets);
    setResearcherProfile(researcherProfile);
  };

  //get information on access election and research purpose election
  const getElectionInformation = async (darId) => {
    let accessElection;
    let accessElectionReview;
    let rpElectionReview;

    try {
      accessElection = await Election.findElectionByDarId(darId);
    } catch (error) {
      //access election is null, this is expected in the case of a closed, unreviewed, or canceled election status
      //so for these cases there is currently no way to display the vote information
    }
    try {
      accessElectionReview = isNil(accessElection) ? null : await Election.findDataAccessElectionReview(accessElection.electionId, true);
      rpElectionReview = isNil(accessElection) ? null : await Election.findRPElectionReview(accessElection.electionId, false);
    } catch (error) {
      Notifications.showError({text: 'Error initializing Election Data'});
      return Promise.reject(error);
    }

    setAccessElection(accessElection);
    setAccessElectionReview(accessElectionReview);
    setRpElectionReview(rpElectionReview);
  };

    return (
      (!isNil(darInfo)) ?
        div({id: 'container', style: {margin: '2rem'}}, [
          div({id: 'header', style: {...SECTION, padding: '1rem 0'}}, [
            AccessReviewHeader({match})
          ]),
          div({id: 'body', style: SECTION}, [
            DarApplication({
              voteAsChair,
              darId,
              darInfo,
              accessElection,
              consent,
              accessElectionReview,
              rpElectionReview,
              researcherProfile,
              datasets
            })
          ])
        ])
        : null
);
}
