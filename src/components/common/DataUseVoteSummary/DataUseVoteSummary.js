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
  //chunking elements subdivides the entire bucket list to rows of max rowElementMaxCount size
  //Needed to provide predictable design, can't have a flexbox row of n elements with infinitesimal width
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
    //lodash-fp caps its normal lodash definitions to one argument (value)
    //if you need to access key/index, you'll need to convert the function to it's uncapped form
    //Below the code used convert to access index, which is needed to determine if an element is positioned at the ends of a row
    //Above fact is needed to determine proper styling of element.
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

  //convert is once again used here to provide unique key identifier for the row
  //necessary for React when rendering elements provided by an array
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