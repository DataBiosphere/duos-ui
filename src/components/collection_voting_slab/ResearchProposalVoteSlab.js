import {useEffect, useState} from 'react';
import {a, div, h, span} from 'react-hyperscript-helpers';
import {DataUseTranslation} from '../../libs/dataUseTranslation';
import {isEmpty, isNil, flatMap, keys, get} from 'lodash/fp';
import {DataUsePills} from './DataUsePill';
import DataUseAlertBox from './DataUseAlertBox';
import {AnimatePresence, motion} from 'framer-motion';
import CollectionSubmitVoteBox from '../collection_vote_box/CollectionSubmitVoteBox';
import {Storage} from '../../libs/storage';
import {
  extractDacRPVotesFromBucket,
  extractUserRPVotesFromBucket,
} from '../../utils/DarCollectionUtils';
import VotesPieChart from '../common/VotesPieChart';
import CollectionAlgorithmDecision from '../CollectionAlgorithmDecision';
import {convertLabelToKey} from '../../libs/utils';
import {ScrollToTopButton} from '../ScrollButton';
import MemberVoteSummary from './MemberVoteSummary';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    paddingBottom: '35px'
  },
  slabTitle: {
    color: '#000000',
    backgroundColor: '#F1EDE8',
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
    backgroundColor: '#F1EDE8',
    borderRadius: '0 4px 4px 4px',
    borderBottom: '4px #646464 solid',
    padding: '15px 25px'
  },
  expandedData: {
    backgroundColor: '#F9F8F6',
    borderRadius: '8px',
    padding: '15px 25px'
  },
  researchPurposeTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginTop: '1rem',
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

const animationAttributes = {
  key:'content',
  initial:'collapsed',
  animate:'expanded',
  exit:'collapsed',
  variants: {
    collapsed: {opacity: 0, height: 0, y: -50, overflow: 'hidden'},
    expanded: {opacity: 1, height: 'auto', y: 0, overflow: 'hidden'}
  },
  transition:{duration: 0.5, ease: [0.50, 0.62, 0.23, 0.98]}
};

const DataUseSummary = ({translatedDataUse}) => {
  return flatMap( key => {
    const dataUses = translatedDataUse[key];
    return DataUsePills(dataUses);
  })(keys(translatedDataUse));
};

const SkeletonLoader = () => {
  return div({className: 'text-placeholder', style: styles.skeletonLoader});
};

const CollapseExpandLink = ({expanded, setExpanded}) => {
  const linkMessage = expanded ?
    'Hide Research Use Statement (Narrative)' :
    'Expand to view Research Use Statement (Narrative)';

  return a({
    style: styles.link,
    id: 'expand-rp-vote-button',
    onClick: () => setExpanded(!expanded),
  }, [linkMessage]);
};

const ResearchPurposeSummary = ({darInfo}) => {
  return !isNil(darInfo) ?
    div({style: styles.researchPurposeSummary}, [darInfo.rus]) :
    div();
};

export const ChairVoteInfo = ({dacVotes, isChair, algorithmResult = {}, adminPage = false}) => {
  return div(
    {
      style: styles.chairVoteInfo,
      isRendered: isChair && dacVotes.length > 0,
      datacy: 'chair-vote-info',
    },
    [
      div(
        {
          style: {
            backgroundColor: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1% 0',
            marginBottom: '10px',
          },
        },
        [
          h(VotesPieChart, {
            votes: dacVotes,
            title: adminPage ? 'DAC Votes (summary)' : "My DAC's Votes (summary)",
            styleOverride: { width: isEmpty(algorithmResult) ? '100%' : '50%' }
          }),
          h(CollectionAlgorithmDecision, {
            algorithmResult,
            styleOverride: { borderLeft: '1px solid #333F52' },
            isRendered: !isEmpty(algorithmResult)
          }),
        ]
      ),
    ]
  );
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

  return div({ datacy: 'rp-slab', style: styles.baseStyle }, [
    div({ style: styles.slabTitle, id: convertLabelToKey(get('key')(bucket)) }, [
      'Research Use Statement (GA4GH DUO)',
      h(ScrollToTopButton, {to: '.header-container'})
    ]),
    div({ isRendered: isLoading, className: 'text-placeholder', style: {height: '100px'}} ),
    div({ isRendered: !isLoading }, [
      div({ style: styles.collapsedData }, [
        isLoading ? h(SkeletonLoader, {}) : h(DataUseSummary, {translatedDataUse}),
        h(CollapseExpandLink, {
          expanded,
          setExpanded,
          isRendered: !isLoading
        })
      ]),
      h(AnimatePresence, { initial: false }, [
        expanded && (
          h(motion.section, animationAttributes, [
            div({ datacy: 'rp-expanded', style: styles.expandedData }, [
              div({ datacy: 'research-purpose' }, [
                span({ style: styles.researchPurposeTitle }, ['Research Use Statement (Narrative)']),
                h(ResearchPurposeSummary, {darInfo}),
                h(DataUseAlertBox, {translatedDataUse}),
                h(CollectionSubmitVoteBox, {
                  question: 'Was the Research Use Statement (Narrative) accurately converted to a structured format?',
                  votes: currentUserVotes,
                  isFinal: false,
                  isDisabled: adminPage || readOnly || isEmpty(currentUserVotes),
                  isLoading,
                  adminPage,
                  bucketKey: bucket.key,
                  updateFinalVote,
                  key: bucket.key
                }),
                h(ChairVoteInfo, {dacVotes, isChair, isLoading, adminPage}),
                h(MemberVoteSummary, {
                  title: adminPage ? 'DAC Member Votes' : (isChair ? 'My DAC Member\'s Votes (detail)' : 'Other DAC Member\'s Votes'),
                  isLoading,
                  dacVotes,
                  adminPage
                })
              ]),
            ]),
          ])
        )
      ])
    ])
  ]);
}
