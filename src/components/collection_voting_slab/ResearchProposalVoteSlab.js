import {useEffect, useState} from 'react';
import {a, div, h, span} from 'react-hyperscript-helpers';
import {DataUseTranslation} from '../../libs/dataUseTranslation';
import {isEmpty, isNil, flatMap, map, keys} from 'lodash/fp';
import DataUsePill from './DataUsePill';
import DataUseAlertBox from './DataUseAlertBox';
import {AnimatePresence, motion} from 'framer-motion';
import CollectionSubmitVoteBox from '../collection_vote_box/CollectionSubmitVoteBox';
import {Storage} from '../../libs/storage';
import {
  collapseVotesByUser, extractDacRPVotesFromBucket,
  extractUserRPVotesFromBucket,
} from '../../utils/DarCollectionUtils';
import VotesPieChart from '../common/VotesPieChart';
import VoteSummaryTable from '../vote_summary_table/VoteSummaryTable';
import CollectionAlgorithmDecision from '../CollectionAlgorithmDecision';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
  },
  slabTitle: {
    color: '#000000',
    backgroundColor: '#F1EDE8',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    width: 'fit-content',
    padding: '1.2rem',
    borderRadius: '4px 4px 0 0',
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

const SlabTitle = () => {
  return div({style: styles.slabTitle}, [
    'Structured Research Purpose'
  ]);
};

const DataUseSummary = ({translatedDataUse}) => {
  return flatMap( key => {
    const dataUses = translatedDataUse[key];
    const label = span({style: styles.dataUseCategoryLabel, isRendered: !isEmpty(dataUses)}, [key + ':']);
    return div({key: `data-use-${key}-container`}, [
      label,
      dataUsePills(dataUses)
    ]);
  })(keys(translatedDataUse));
};

export const dataUsePills = (dataUses) => {
  return map( dataUse => {
    return DataUsePill({
      dataUse,
      key: dataUse.code
    });
  })(dataUses);
};

const SkeletonLoader = () => {
  return div({className: 'text-placeholder', style: styles.skeletonLoader});
};

const CollapseExpandLink = ({expanded, setExpanded}) => {
  const linkMessage = expanded ?
    'Hide Research Purpose and Vote' :
    'Expand to view Research Purpose and Vote';

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

export const ChairVoteInfo = ({dacVotes, isChair, isLoading, algorithmResult = {}, adminPage = false}) => {
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
          },
        },
        [
          h(VotesPieChart, {
            votes: dacVotes,
            title: adminPage ? 'DAC Votes (summary)' : "My DAC's Votes (summary)"
          }),
          h(CollectionAlgorithmDecision, {
            algorithmResult,
            styleOverride: { borderLeft: '1px solid #333F52' },
            isRendered: !isEmpty(algorithmResult)
          }),
        ]
      ),
      div([adminPage ? 'DAC Votes' : "My DAC's Votes (detail)"]),
      h(VoteSummaryTable, {
        dacVotes: collapseVotesByUser(dacVotes),
        isLoading,
        adminPage
      }),
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


  return div({datacy: 'srp-slab', style: styles.baseStyle}, [
    h(SlabTitle, {}),
    div({style: styles.collapsedData}, [
      isLoading ? h(SkeletonLoader, {}) : h(DataUseSummary, {translatedDataUse}),
      h(CollapseExpandLink, {
        expanded,
        setExpanded,
        isRendered: !isLoading
      })
    ]),
    h(AnimatePresence, {initial:false}, [
      expanded && (
        h(motion.section, animationAttributes, [
          div({datacy: 'srp-expanded', style: styles.expandedData}, [
            div({datacy: 'research-purpose'}, [
              span({style: styles.researchPurposeTitle}, ['Research Purpose']),
              h(ResearchPurposeSummary, {darInfo}),
              h(DataUseAlertBox, {translatedDataUse}),
              h(CollectionSubmitVoteBox, {
                question: 'Was the research purpose accurately converted to a structured format?',
                votes: currentUserVotes,
                isFinal: false,
                isDisabled: adminPage || readOnly || isEmpty(currentUserVotes),
                isLoading,
                adminPage,
                bucketKey: bucket.key,
                updateFinalVote,
                key: bucket.key
              }),
              h(ChairVoteInfo, {dacVotes, isChair, isLoading, adminPage})
            ]),
          ]),
        ])
      )
    ])
  ]);
}
