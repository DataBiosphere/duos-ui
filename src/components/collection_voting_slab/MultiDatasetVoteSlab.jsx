import React from 'react';
import CollectionSubmitVoteBox from '../collection_vote_box/CollectionSubmitVoteBox';
import {
  filter,
  flow,
  map,
  isNil,
  isEmpty,
  get,
  includes,
  every,
  toLower,
} from 'lodash/fp';
import { Storage } from '../../libs/storage';
import { useEffect, useState } from 'react';
import DatasetsRequestedPanel from './DatasetsRequestedPanel';
import { ChairVoteInfo } from './ResearchProposalVoteSlab';
import CollectionAlgorithmDecision from '../CollectionAlgorithmDecision';
import {
  extractDacDataAccessVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
} from '../../utils/DarCollectionUtils';
import { Alert } from '../Alert';
import { convertLabelToKey } from '../../libs/utils';
import { DataUsePills } from './DataUsePill';

import MemberVoteSummary from './MemberVoteSummary';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 'bold',
    borderRadius: '0 8px 8px 8px',
    border: '#84a3db 2px solid',
    padding: '20px',
    td: {
      padding: '10px 10px 20px 20px'
    }
  },
  slabTitle: {
    display: 'flex',
    paddingBottom: '15px',
  },
  slatTitleText: {
    display: 'flex',
    fontSize: 17,
    fontWeight: 800,
    height: '32px',
    paddingLeft: '-10%',
    color: '#333F52',
    marginTop: '-5px',
    columnGap: '2rem'
  },
  question: {
    fontSize: 17,
    color: '#333F52',
    marginLeft: '30px',
  },
  dataUses: {},
  voteInfo: {},
  chairVoteInfo: {},
};

export default function MultiDatasetVoteSlab(props) {
  const [currentUserVotes, setCurrentUserVotes] = useState([]);
  const [dacVotes, setDacVotes] = useState([]);
  const {
    title,
    bucket,
    dacDatasetIds,
    isChair,
    isApprovalDisabled,
    isLoading,
    readOnly,
    adminPage,
    updateFinalVote,
  } = props;
  const { algorithmResult, key } = bucket;

  useEffect(() => {
    const user = Storage.getCurrentUser();
    setDacVotes(extractDacDataAccessVotesFromBucket(bucket, user, adminPage));
    setCurrentUserVotes(
      extractUserDataAccessVotesFromBucket(bucket, user, isChair, adminPage)
    );
  }, [bucket, isChair, adminPage]);

  const DataUseSummary = () => {
    const dataUses = get('dataUses')(bucket);
    return !isNil(dataUses)
      ? <div style={styles.dataUses}>{DataUsePills(dataUses)}</div>
      : <></>;
  };

  const VoteInfoSubsection = () => {
    const electionIds = map((vote) => vote.electionId)(currentUserVotes);
    const allOpenElections = flow(
      get('elections'),
      filter((election) => includes(election.electionId)(electionIds)),
      every((election) => toLower(election.status) === 'open')
    )(bucket);

    return (
      <div style={styles.voteInfo}>
        <div>
          {!adminPage && !allOpenElections && !readOnly && <Alert
            title={'Voting is disabled since this election is not open.'}
            type={'danger'}
          />}
        </div>
        <div>
          <CollectionSubmitVoteBox
            votes={currentUserVotes}
            isFinal={isChair}
            isDisabled={adminPage || readOnly || isEmpty(currentUserVotes) || !allOpenElections}
            isApprovalDisabled={isApprovalDisabled}
            isLoading={isLoading}
            adminPage={adminPage}
            bucketKey={key}
            updateFinalVote={updateFinalVote}
          />
        </div>
      </div>
    );

  };

  function DatasetDisplayTable() {
    return (
      <>
        <table className={'layout-table'} role='presentation' style={{width:'-webkit-fill-available'}}>
          <tbody>
            <tr>
              <td style={{width: '50%', verticalAlign: 'text-top',}}>
                <div style={styles.slabTitle} key={convertLabelToKey(get('key')(bucket))}>
                  <span style={styles.slatTitleText}>{title}</span>
                </div>
                <DataUseSummary/></td>
              <td style={{width: '50%', verticalAlign: 'text-top'}}>
                <div style={styles.question}>
                  <p>Should data access be granted to this applicant?</p>
                </div><VoteInfoSubsection/></td>
            </tr>
            <tr>
              <td style={{width: '50%', verticalAlign: 'text-top'}}><ChairVoteInfo
                dacVotes={dacVotes}
                isChair={isChair}
                isLoading={isLoading}
                adminPage={adminPage}/>
              </td>
              <td style={{width: '50%', verticalAlign: 'text-top'}}>
                {!isEmpty(algorithmResult) && <CollectionAlgorithmDecision
                  algorithmResult={algorithmResult}
                />}
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{paddingLeft:'20px'}}>
          <MemberVoteSummary
            dacVotes={dacVotes}
            title={adminPage
              ? 'DAC Member Votes'
              : isChair
                ? "My DAC Member's Votes (detail)"
                : "Other DAC Member's Votes"}
            isLoading={isLoading}
            adminPage={adminPage}
            isChair={isChair}/>
        </div>
      </>
    );
  }

  function DatasetsRequested() {
    return (<DatasetsRequestedPanel
      dacDatasetIds={dacDatasetIds}
      bucketDatasets={bucket.datasets}
      isLoading={isLoading}
      adminPage={adminPage}
    />);
  }

  return(
    <div style={styles.baseStyle} data-cy={'dataset-vote-slab'}>
      {!isLoading ? <div style={{display:'inline'}}>
        <DatasetDisplayTable/>
        <DatasetsRequested/>
      </div> :
        <div className={'text-placeholder'} style={{ height: '100px' }}></div>}
    </div>
  );

}