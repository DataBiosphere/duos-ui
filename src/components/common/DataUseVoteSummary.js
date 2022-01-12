import { h, div, span } from 'react-hyperscript-helpers';
import { isEmpty, chunk, map, flow, flatMap } from 'lodash/fp';
import { CheckCircleOutlined, CancelOutlined, AutorenewOutlined, CompareArrowsOutlined } from '@material-ui/icons';
import { blue, green, red, yellow } from '@material-ui/core/colors';

//Widget should be dumb, bucketing logic should be contained in a different file
//Bucketing logic will probably be reused often

//NOTE: mockups seem to use Montserrat (or a font very similar to it)
//We used to use it until UX advised us not to (around a year ago?)
//Is the font good now? Would be nice to have an font standard going forward for code and mockups
const iconFontStyle = {
  fontFamily: 'Arial',
  fontSize: '1.6rem',
  fontWeight: 600,
  flex: 1,
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '2.5%',
  margin: '2.5%'
};

const labelFontStyle = {
  fontFamily: 'Arial',
  fontSize: 20,
  fontWeight: 600,
  flex: 1,
  justifyContent: 'center',
  display: 'flex',
  padding: '12%',
  backgroundColor: 'rgb(243, 245, 248)',
  textAlign: 'center',
  alignItems: 'center'
};

const convertLabelToKey = (label) => {
  return label.split(' ').join('-');
};

const VoteResultLabel = ({propKey, label, additionalLabelStyle = {}}) => {
  return div({
    style: Object.assign({}, labelFontStyle, additionalLabelStyle),
    className: `vote-result-label-text-${propKey}`,
    key: `vote-result-label-${propKey}`
  }, [label]);
};

//Possible icons should be Yes, No, Mixed, In Progress
const VoteResultIcon = ({result, propKey}) => {
  const iconSize = 50;
  const margin = '2.5%';
  const modifiedTextStyle = Object.assign({}, iconFontStyle, {fontSize: '2.2rem'});
  const templates = {
    true: {
      output: [
        h(CheckCircleOutlined, {
          className: `vote-result-yes-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        span(
          { className: `vote-result-yes-text-${propKey}`, style: modifiedTextStyle },
          ['Yes']
        ),
      ],
      colorStyle: {
        backgroundColor: green[500],
        flex: 1
      }
    },
    false: {
      output: [
        h(CancelOutlined, {
          className: `vote-result-no-icon-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        span(
          { className: `vote-result-no-text-${propKey}`, style: modifiedTextStyle },
          ['No']
        ),
      ],
      colorStyle: {
        backgroundColor: red[500],
        flex: 1
      }
    },
    underReview: {
      output: [
        h(AutorenewOutlined, {
          className: `vote-result-in-progress-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        div(
          { className: `vote-result-in-progress-${propKey}`, style: Object.assign(modifiedTextStyle, { fontSize: '1.7rem' }) },
          ['Under Review']
        ),
      ],
      colorStyle: {
        backgroundColor: blue[500],
        flex: 1,
      },
    },
    mixed: {
      output: [
        h(CompareArrowsOutlined, {
          className: `vote-result-mixed-${propKey}`,
          style: { fontSize: iconSize, margin, flex: 1 },
        }),
        div({ className: `vote-mixed-${propKey}`, style: modifiedTextStyle },
          ['Mixed']
        ),
      ],
      colorStyle: {
        backgroundColor: yellow[500],
        color: 'white',
      },
    },
  };
  const {output, colorStyle} = templates[result];
  return div({
    style: Object.assign({borderRadius: '4%'}, colorStyle, iconFontStyle),
    key: `vote-result-box-${propKey}`
  }, output);
};

const VoteResultContainer = ({finalVotes = [], label, additionalLabelStyle = {}}) => {
  const baseContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    width: '8%',
  };
  const hyphenatedKey = convertLabelToKey(label);
  const result = determineUnanimousVoteResult(finalVotes);
  return div({
    style: baseContainerStyle,
    key: hyphenatedKey,
    className: 'vote-summary-container'
  }, [
    h(VoteResultLabel, {propKey: hyphenatedKey, label, additionalLabelStyle}),
    h(VoteResultIcon, {result, propKey: hyphenatedKey})
  ]);
};

const determineUnanimousVoteResult = (votes = []) => {
  const voteCount = votes.length;
  if(isEmpty(votes) || voteCount < 1) {
    return 'underReview';
  }
  let voteTally = {
    true: 0,
    false: 0
  };

  votes.forEach((vote) => {
    voteTally[vote] += 1;
  });

  if(voteTally.true === voteCount) {
    return true;
  } else if (voteTally.false === voteCount) {
    return false;
  } else if (voteTally.true + voteTally.false === voteCount) {
    return 'mixed';
  } else {
    return 'underReview';
  }
};


export default function DataUseVoteSummary({dataUseBuckets}) {
  const rowElementMaxCount = 11;
  const chunkedBuckets = chunk(rowElementMaxCount)(dataUseBuckets);
  //first element -> left corners rounded, no right border
  //middle element, no rounded corners, no left or right border
  //end element -> right corners rounded, no left border
  const borderStyle = '1% solid rgb(225, 225, 229)';
  const startElementStyle = {
    borderTopLeftRadius: '4%',
    border: borderStyle,
    borderRight: '0px',
    marginLeft: '2.5%'
  };
  const endElementStyle = {
    borderTopRightRadius: '4%',
    border: borderStyle,
    borderLeft: '0px',
    marginRight: '2.5%'
  };
  const middleElementStyle = {
    border: borderStyle,
    borderLeft: '0px',
    borderRight: '0px'
  };

  const elementTemplate = (row = []) => {
    const elementLength = row.length;

    //uncap map to keep track of index for styling
    return map.convert({cap: false})((bucket, index) => {
      const additionalLabelStyle = index === 0 ? startElementStyle :
        index === elementLength - 1 ? endElementStyle : middleElementStyle;
      const { key, votes = []} = bucket;
      const finalVotes = flow([
        map((votes) => votes.finalVotes),
        flatMap((finalVotes) => finalVotes),
      ])(votes);
      return h(VoteResultContainer, { label: key, finalVotes, additionalLabelStyle }, []);
    })(row);
  };

  const rowTemplate = map.convert({cap:false})((row, index) =>
    div({ style: { display: 'flex', justifyContent: 'flex-start'}, className: 'vote-summary-row', key: `summary-row-${index}` }, elementTemplate(row))
  );

  return div({style: {margin: '1% 0'}, className: 'vote-summary-header-component'}, [rowTemplate(chunkedBuckets)]);

}