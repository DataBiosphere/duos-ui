import {useEffect, useState} from 'react';
import {div} from 'react-hyperscript-helpers';
import {AccessReviewHeader} from './access_review/AccessReviewHeader';
import {Election} from '../libs/ajax';
import {getDarData, Notifications} from '../libs/utils';
import {isNil} from 'lodash/fp';
import {DarApplication} from "./access_review/DarApplication";
import {Match} from "../libs/ajax";

const SECTION = {
  margin: '20px',
};

export default function ReviewResults(props) {
  const darId = props.match.params.referenceId;
  const [datasets, setDatasets] = useState();
  const [darInfo, setDarInfo] = useState();
  const [consent, setConsent] = useState();
  const [researcherProfile, setResearcherProfile] = useState();
  const [accessElection, setAccessElection] = useState();
  const [accessElectionReview, setAccessElectionReview] = useState();
  const [rpElectionReview, setRpElectionReview] = useState();
  const [voteAsChair] = useState(true);
  const [matchData, setMatchData] = useState();

  useEffect(() => {
    setData(darId);

  }, [darId]);

  const setData = async (darId) => {
    //get information associated with the access request
    const {datasets, darInfo, consent, researcherProfile} = await getDarData(darId);
    setDarInfo(darInfo);
    setConsent(consent);
    setDatasets(datasets);
    setResearcherProfile(researcherProfile);

    //get information about access election and research purpose election
    let accessElection;
    let accessElectionReview;
    let rpElectionReview;

    try {
      accessElection = await Election.findElectionByDarId(darId);
    } catch (error) {
      //access election is null, this is expected for a dar with an unreviewed election status
      //so there is no vote information to display
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

    //get the duos matching algorithm decision
    let matchData;

    try {
      matchData = await Match.findMatch(consent.consentId, accessElection.referenceId);
      setMatchData(matchData);
      console.log(matchData);
    } catch (e) {
      console.log(e);
      Notifications.showError({ text: `Something went wrong trying to get match algorithm results. Error code: ${e.status}` });
    }
  };

  return (
    (!isNil(darInfo)) ?
      div({id: 'container', style: {margin: '2rem'}}, [
        div({id: 'header', style: {...SECTION, padding: '1rem 0'}}, [
          AccessReviewHeader({})
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
            datasets,
            matchData
          })
        ])
      ])
      : null
  );
}
