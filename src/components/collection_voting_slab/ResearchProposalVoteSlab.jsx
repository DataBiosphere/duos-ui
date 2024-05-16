import React,{useEffect, useState} from 'react';
import {DataUseTranslation} from '../../libs/dataUseTranslation';
import {isEmpty, isNil, flatMap, keys, get} from 'lodash/fp';
import {DataUsePills} from './DataUsePill';
import DataUseAlertBox from './DataUseAlertBox';
import CollectionSubmitVoteBox from '../collection_vote_box/CollectionSubmitVoteBox';
import {Storage} from '../../libs/storage';
import {
  extractDacRPVotesFromBucket,
  extractUserRPVotesFromBucket,
} from '../../utils/DarCollectionUtils';
import VotesPieChart from '../common/VotesPieChart';
import {convertLabelToKey} from '../../libs/utils';
import MemberVoteSummary from './MemberVoteSummary';
import HighlightText from '../HighlightText';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    borderRadius: '0 8px 8px 8px',
    border: '#84a3db 2px solid',
  },
  slabTitle: {
    color: '#000000',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    width: 'fit-content',
    padding: '1.2rem',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: '2rem'
  },
  dataUseCategoryLabel: {
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  link: {
    color: '#0948B7',
    fontWeight: '500',
    marginLeft: '7rem'
  },
  collapsedData: {
    color: '#333F52',
    padding: '15px 25px'
  },
  expandedData: {
    paddingLeft: '15px'
  },
  researchPurposeTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginTop: '2rem',
    display: 'inline-block'
  },
  researchPurposeSummary: {
    fontSize: '1.4rem',
    fontWeight: '500',
    lineHeight: '20px',
    margin: '1.5rem'
  },
  chairVoteInfo: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '1.5rem',
    fontWeight: 'bold',
  },
  skeletonLoader: {
    height: '60px',
  }
};

const highlightedWords = [
  {
    bgColor: 'rgba(0,0,100,.2)',
    textColor: '#0948B7',
    words: [
      'Health',
      'Medical',
      'Biomedical',
      'Disease',
      'Methods',
      'Algorithm',
      'Population',
      'Origin',
      'Ancestry',
      'Controls',
      'Commercial',
      'Profit'
    ]
  }
];

const DataUseSummary = ({translatedDataUse}) => {
  return flatMap( key => {
    const dataUses = translatedDataUse[key];
    return <div key={key}>{DataUsePills(dataUses)}</div>;
  })(keys(translatedDataUse));
};

const SkeletonLoader = () => {
  return <div className='text-placeholder' style={styles.skeletonLoader}></div>;
};

const CollapseExpandLink = ({expanded, setExpanded}) => {
  const linkMessage = expanded ?
    'Hide Research Use Statement (Narrative)' :
    'Expand to view Research Purpose and Vote';

  return (
    <a
      style={styles.link}
      id='expand-rp-vote-button'
      onClick={() => setExpanded(!expanded)}
    >
      {linkMessage}
    </a>
  );
};

const ResearchPurposeSummary = ({darInfo}) => {
  return !isNil(darInfo) ? (
    <div style={styles.researchPurposeSummary}>
      <HighlightText
        highlight={highlightedWords}
        text={darInfo.rus}
      />
    </div>
  ) : (
    <div />
  );
};

export const ChairVoteInfo = ({ dacVotes, isChair, adminPage = false }) => {

  if (isChair && dacVotes.length > 0) {
    return (
      <div
        style={styles.chairVoteInfo}
        data-cy='chair-vote-info'
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '1% 0',
            marginTop: '10%',
          }}
        >
          <div
            style={{ fontSize: 17, color: '#333F52', fontFamily: 'Montserrat' }}
          >
            {adminPage ? 'DAC Votes (summary)' : `My DAC's Votes (summary)`}
          </div>
          <VotesPieChart
            votes={dacVotes}
            styleOverride={{}}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default function ResearchProposalVoteSlab(props) {
  const [expanded, setExpanded] = useState(false);
  const [currentUserVotes, setCurrentUserVotes] = useState([]);
  const [dacVotes, setDacVotes] = useState([]);
  const {darInfo, bucket, isChair, isLoading, readOnly, adminPage, updateFinalVote} = props;
  const translatedDataUse = !isNil(darInfo) ? DataUseTranslation.translateDarInfo(darInfo) : {};
  useEffect(() => {
    const user = Storage.getCurrentUser();
    setDacVotes(extractDacRPVotesFromBucket(bucket, user, adminPage));
    setCurrentUserVotes(extractUserRPVotesFromBucket(bucket, user, isChair, adminPage));
  }, [bucket, isChair, adminPage]);

  return (
    <div data-cy='rp-slab' style={styles.baseStyle}>
      <div style={styles.slabTitle} id={convertLabelToKey(get('key')(bucket))}>
        RUS (GA4GH DUO)
      </div>
      {isLoading && (
        <div className='text-placeholder' style={{ height: '100px' }} />
      )}

      {
        !isLoading && (
          <div>
            <div style={styles.collapsedData}>
              {isLoading ? (
                <SkeletonLoader/>
              ) : (
                <DataUseSummary translatedDataUse={translatedDataUse} />
              )}
              {!isLoading && <CollapseExpandLink expanded={expanded} setExpanded={setExpanded} />}
              {expanded && (
                <div data-cy='rp-expanded' style={styles.expandedData}>
                  <div data-cy='research-purpose'>
                    <span style={styles.researchPurposeTitle}>Research Use Statement (Narrative)</span>
                    <ResearchPurposeSummary darInfo={darInfo} />
                    <DataUseAlertBox translatedDataUse={translatedDataUse} />
                    {!isEmpty(bucket) && (
                      <CollectionSubmitVoteBox
                        question='Was the Research Use Statement (Narrative) accurately converted to a structured format?'
                        votes={currentUserVotes}
                        isFinal={false}
                        isDisabled={adminPage || readOnly || isEmpty(currentUserVotes)}
                        isLoading={isLoading}
                        adminPage={adminPage}
                        bucketKey={bucket.key}
                        updateFinalVote={updateFinalVote}
                        key={bucket.key}
                      />
                    )}
                    <ChairVoteInfo dacVotes={dacVotes} isChair={isChair} isLoading={isLoading} adminPage={adminPage} />
                    <MemberVoteSummary
                      title={adminPage ? 'DAC Member Votes' : isChair ? `My DAC Member's Votes (detail)` : `Other DAC Member's Votes`}
                      isLoading={isLoading}
                      dacVotes={dacVotes}
                      adminPage={adminPage}
                      isChair={isChair}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
