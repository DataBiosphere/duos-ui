import { useEffect } from 'react';
import { h, div } from 'react-hyperscript-helpers';
import { chunk, map, flow, flatMap } from 'lodash/fp';
import VoteResultContainer from './VoteResultContainer';
import ReactTooltip from 'react-tooltip';

//NOTE: mockups seem to use Montserrat (or a font very similar to it)
//We used to use it until UX advised us not to (around a year ago?)
//Is the font good now? Would be nice to have an font standard going forward for code and mockups

export default function DataUseVoteSummary({dataUseBuckets, isLoading}) {
  useEffect(() => {
    ReactTooltip.rebuild();
  });

  const rpVotes = flow([
    flatMap((dataUse) => dataUse.votes),
    flatMap((votes) => votes.rpVotes),
  ])(dataUseBuckets);
  const rpVoteData = {
    key: 'RP Vote',
    votes: [{finalVotes: rpVotes}],
    legacyFlag: true
  };

  const clonedBuckets = dataUseBuckets.slice(0);
  clonedBuckets.unshift(rpVoteData);
  const rowElementMaxCount = 11;
  const chunkedBuckets = chunk(rowElementMaxCount)(clonedBuckets);
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
      const additionalLabelStyle = index === 0 && elementLength > 1? startElementStyle :
        index === elementLength - 1 && elementLength > 1 ? endElementStyle : middleElementStyle;
      const { key, votes = [], legacyFlag } = bucket;
      const finalVotes = flatMap(votingDataObj => votingDataObj.finalVotes)(votes);
      return h(VoteResultContainer, { label: key, finalVotes, additionalLabelStyle, legacyFlag }, []);
    })(row);
  };

  const rowTemplate = map.convert({cap:false})((row, index) =>
    div({ style: { display: 'flex', justifyContent: 'flex-start'}, className: 'vote-summary-row', key: `summary-row-${index}` }, elementTemplate(row))
  );

  return div({
    isRendered: !isLoading,
    style: {margin: '1% 0'}, className: 'vote-summary-header-component'
  }, [
    rowTemplate(chunkedBuckets),
    h(ReactTooltip, {
      id: 'tip_legacy_result',
      place: 'left',
      effect: 'solid',
      multiline: true,
      className: 'tooltip-wrapper'
    })
  ]);

}