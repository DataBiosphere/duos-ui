import { h, div, span } from 'react-hyperscript-helpers';
import { isEmpty, every, any, chunk, map, flow, flatMap } from 'lodash/fp';
import { CheckCircleOutlined, CancelOutlined, AutorenewOutlined, CompareArrowsOutlined } from '@material-ui/icons';
import { blue, green, red, yellow } from '@material-ui/core/colors';

//Widget should be dumb, bucketing logic should be contained in a different file
//Bucketing logic will probably be reused often

//NOTE: mockups seem to use Montserrat
//We used to use it until UX advised us not to (around a year ago?)
//Is the font good for use? Would be nice to have an font standard going forward for code and mockups
const iconFontStyle = {
  fontFamily: 'Arial',
  fontSize: 20,
  fontWeight: 600,
  flex: 1,
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const labelFontStyle = {
  fontFamily: 'Arial',
  fontSize: 17,
  fontWeight: 600,
  flex: 1,
  justifyContent: 'space-around',
  display: 'flex'
};

const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};

const VoteResultLabel = ({propKey, label}) => {
  return div({
    style: labelFontStyle,
    className: `vote-result-label-text-${propKey}`,
    key: `vote-result-label-${propKey}`
  }, [label]);
};

//Possible icons should be Yes, No, Mixed, In Progress
const VoteResultIcon = ({result, propKey}) => {
  const iconSize = 50;
  const margin = '2%';
  const templates = {
    true: [
      h(CheckCircleOutlined, {
        className: `vote-result-yes-icon-${propKey}`,
        style: { color: green[500], flex: 1, }
      }),
      span({ className: `vote-result-yes-text-${propKey}`, style: iconFontStyle }, ['Yes'])
    ],
    false: [
      h(CancelOutlined, {
        className: `vote-result-no-icon-${propKey}`,
        style: { color: red[500], flex: 1 }
      }),
      span({ className: `vote-result-no-text-${propKey}`, span: iconFontStyle }, ['No'])
    ],
    inProgress: [
      h(AutorenewOutlined, {
        className: `vote-result-in-progress-${propKey}`,
        style: {color: blue[500], flex: 1}
      }),
      span({ className: `vote-result-in-progress-${propKey}`, span: iconFontStyle }, ['In Progress'])
    ],
    mixed: {
      output: [
        h(CompareArrowsOutlined, {
          className: `vote-result-mixed-${propKey}`,
          style: {fontSize: iconSize, margin, flex:1}
          // style: { color: 'white', flex: 1, fontSize: 40, backgroundColor: yellow[500], borderRadius: '2px'}
        }),
        div({ className: `vote-mixed-${propKey}`, style: iconFontStyle}, ['Mixed'])
      ],
      colorStyle: {
        backgroundColor: yellow[500],
        color: 'white'
      }
    }
  };

  const {output, colorStyle} = templates[result];
  return div({
    style: Object.assign({}, colorStyle, iconFontStyle),
    key: `vote-result-box-${propKey}`
  }, output);
};

const VoteResultContainer = ({finalVotes = [], label, width}) => {
  const hyphenatedKey = convertLabelToKey(label);
  const result = determineUnanimousVoteResult(finalVotes);
  return div({
    style: {
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      width
    },
    key: hyphenatedKey
  }, [
    h(VoteResultLabel, {propKey: hyphenatedKey, label}),
    h(VoteResultIcon, {result, propKey: hyphenatedKey})
  ]);
};

const determineUnanimousVoteResult = (votes) => {
  if(isEmpty(votes) || votes.length < 1) {
    return 'inProgress';
  }

  const voteStandard = votes[0];
  if(any({'vote': undefined})(votes)) {
    return 'inProgress';
  }
  return every({'vote': voteStandard})(votes) ? voteStandard : 'mixed';
};


export default function DataUseVoteSummary({dataUseBuckets}) {
  const rowElementMaxCount = 10;
  const chunkedBuckets = chunk(rowElementMaxCount)(dataUseBuckets);

  //NOTE: Unreasonbale to expect summary to display vote results on a single bar
  //Upper bound on number of buckets is theoretically infinite, can't contain on a row of fixed display width
  //Need to set bounds on the number of divs/cards/whatever per row
  //Styling doesn't need to change, you just need to have multiple rows

  //Need to do some additional processing here
  const elementTemplate = map((bucket) => {
    const { key, votes = []} = bucket;
    const finalVotes = flow([
      map((votes) => votes.finalVotes),
      flatMap((finalVotes) => finalVotes),
    ])(votes);
    return h(VoteResultContainer, { label: key, finalVotes }, []);
  });

  const rowTemplate = map((row) =>
    div({ style: { display: 'flex', justifyContent: 'space-around' } }, elementTemplate(row))
  );

  return div({style: { flexDirection: 'column', justifyContent: 'space-around' }},
    rowTemplate(chunkedBuckets)
  );
}