import { useEffect } from 'react';
import { h, div } from 'react-hyperscript-helpers';
import { chunk, map, flatMap } from 'lodash/fp';
import VoteResultContainer from './VoteResultContainer';
import ReactTooltip from 'react-tooltip';
import { isEmpty } from 'lodash';

export default function DataUseVoteSummary({dataUseBuckets, isLoading}) {
  useEffect(() => {
    ReactTooltip.rebuild();
  });
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
      const additionalLabelStyle = index === 0 && elementLength > 1? startElementStyle :
        index === elementLength - 1 && elementLength > 1 ? endElementStyle : middleElementStyle;
      const { key, votes = {}, isRP } = bucket;
      const targetAttr = isRP ? 'rp' : 'dataAccess';
      const finalVotes = flatMap((voteObj) =>
        !isEmpty(voteObj) ? voteObj[targetAttr].finalVotes : []
      )(votes);
      return h(VoteResultContainer, { label: key, finalVotes, additionalLabelStyle }, []);
    })(row);
  };

  const rowTemplate = map.convert({cap:false})((row, index) =>
    div({ style: { display: 'flex', justifyContent: 'flex-start'}, className: 'vote-summary-row', key: `summary-row-${index}` }, elementTemplate(row))
  );

  return div({
    className: 'vote-summary-header-component',
    isRendered: !isLoading,
    style: {margin: '1% 0'},
  }, [
    rowTemplate(chunkedBuckets),
    h(ReactTooltip, {
      id: 'tip_mixed_result',
      place: 'left',
      effect: 'solid',
      multiline: true,
      className: 'tooltip-wrapper'
    })
  ]);

}