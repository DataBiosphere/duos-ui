import React, {useEffect, useState} from 'react';
import CollectionSubmitVoteBox from 'src/components/collection_vote_box/CollectionSubmitVoteBox';
import {get, isEmpty, isNil} from 'lodash/fp';
import {Storage} from 'src/libs/storage';
import DatasetsRequestedPanel from 'src/components/collection_voting_slab/DatasetsRequestedPanel';
import {ChairVoteInfo} from 'src/components/collection_voting_slab/ResearchProposalVoteSlab';
import CollectionAlgorithmDecision from 'src/components/CollectionAlgorithmDecision';
import {extractDacDataAccessVotesFromBucket, extractUserDataAccessVotesFromBucket} from 'src/utils/DarCollectionUtils';
import {Alert} from 'src/components/Alert';
import {convertLabelToKey} from 'src/libs/utils';
import {DataUsePills} from 'src/components/collection_voting_slab/DataUsePill';
import MemberVoteSummary from 'src/components/collection_voting_slab/MemberVoteSummary';
import {DataAccessRequest, Dataset, DataUse, Election, Vote} from 'src/types/model';


type Collection = {
  dars: { [key: string]: DataAccessRequest };
};

type Bucket = {
  key: string;
  algorithmResult?: unknown;
  datasets: Dataset[];
  elections: Election[];
  dataUses?: DataUse[];
};

interface MultiDatasetVoteSlabProps {
  title: string;
  bucket: Bucket;
  collection: Collection;
  dacDatasetIds?: number[];
  isChair?: boolean;
  isApprovalDisabled?: boolean;
  isLoading?: boolean;
  readOnly?: boolean;
  adminPage?: boolean;
  updateFinalVote?: (...args: any[]) => void;
  reloadFn?: (...args: any[]) => void;
}

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

export default function MultiDatasetVoteSlab(props: MultiDatasetVoteSlabProps) {
  const [currentUserVotes, setCurrentUserVotes] = useState<Vote[]>([]);
  const [dacVotes, setDacVotes] = useState<Vote[]>([]);
  const {
    title,
    bucket,
    collection,
    dacDatasetIds,
    isChair,
    isApprovalDisabled,
    isLoading,
    readOnly,
    adminPage,
    updateFinalVote,
    reloadFn
  } = props;
  const {algorithmResult, key} = bucket;
  const [isDMI, setIsDMI] = useState(false);

  useEffect(() => {
    const sorted = Object.values(collection.dars).sort(
        (a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime()
    );
    const mostRecentDar = sorted.at(0);
    if (mostRecentDar?.progressReport && mostRecentDar.data?.dmi) {
      setIsDMI(true);
    }
    const user = Storage.getCurrentUser();
    setDacVotes(extractDacDataAccessVotesFromBucket(bucket, user, adminPage));
    setCurrentUserVotes(
        extractUserDataAccessVotesFromBucket(bucket, user, isChair, adminPage)
    );
  }, [bucket, isChair, adminPage, collection.dars]);

  const DataUseSummary = () => {
    const dataUses = get('dataUses')(bucket);
    return !isNil(dataUses)
        ? <div style={styles.dataUses}>{DataUsePills(dataUses)}</div>
        : <></>;
  };

  const VoteInfoSubsection = () => {
    const electionIds = currentUserVotes.map((vote) => vote.electionId);
    const allOpenElections = bucket.elections
        .filter((election) => electionIds.includes(election.electionId))
        .filter((election) => election.status?.toLowerCase() === 'open');

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
                reloadFn={reloadFn}
            />
          </div>
        </div>
    );
  };

  return (
      <div style={styles.baseStyle} data-cy={'dataset-vote-slab'}>
        <div style={{display: 'inline'}}>
          <table className={'layout-table'} style={{width: '-webkit-fill-available'}}>
            <thead/>
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
                </div>
                <VoteInfoSubsection/></td>
            </tr>
            <tr>
              <td style={{width: '50%', verticalAlign: 'text-top'}}>
                <ChairVoteInfo
                    dacVotes={dacVotes}
                    isChair={isChair}
                    isLoading={isLoading}
                    adminPage={adminPage}/>
              </td>
              <td style={{width: '50%', verticalAlign: 'text-top'}}>
                {!isDMI && !isEmpty(algorithmResult) && <CollectionAlgorithmDecision
                  algorithmResult={algorithmResult}
                />}
              </td>
            </tr>
            </tbody>
          </table>
          <div style={{paddingLeft: '20px'}}>
            <MemberVoteSummary
                dacVotes={dacVotes}
                title={adminPage
                    ? 'DAC Member Votes'
                    : isChair
                        ? 'My DAC Member\'s Votes (detail)'
                        : 'Other DAC Member\'s Votes'}
                isLoading={isLoading}
                adminPage={adminPage}
                isChair={isChair}/>
          </div>
          <DatasetsRequestedPanel
              dacDatasetIds={dacDatasetIds}
              bucketDatasets={bucket.datasets}
              isLoading={isLoading}
              adminPage={adminPage}/>
        </div>
      </div>
  );
}