import { useEffect } from 'react';
import {h, div, span} from 'react-hyperscript-helpers';
import {chunk, map, range} from 'lodash/fp';
import ReactTooltip from 'react-tooltip';
import VoteResultBox from './VoteResultBox';
import {extractDacFinalVotesFromBucket} from '../../../utils/DarCollectionUtils';

export default function DataUseVoteSummary({dataUseBuckets, currentUser, isLoading, adminPage}) {
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
  const borderStyle = '0.1rem solid #E9ECEF';
  const dividerStyle = '0.01rem solid #979797';
  const startElementStyle = {
    borderTopLeftRadius: '4%',
    borderTop: borderStyle,
    borderLeft: borderStyle,
    borderRight: dividerStyle
  };
  const endElementStyle = {
    borderTopRightRadius: '4%',
    borderTop: borderStyle,
    borderLeft: dividerStyle,
    borderRight: borderStyle
  };
  const middleElementStyle = {
    borderTop: borderStyle,
    borderLeft: dividerStyle,
    borderRight: dividerStyle
  };


  //convert is once again used here to provide unique key identifier for the row
  //necessary for React when rendering elements provided by an array
  const rowTemplate = map.convert({cap:false})((row, index) =>
    div({
      className: 'vote-summary-row', key: `summary-row-${index}`,
      style: {
        display: 'flex',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        margin: '1% 0'
      }
    },
    elementTemplate(row))
  );

  const elementTemplate = (row = []) => {
    const elementLength = row.length;
    //lodash-fp caps its normal lodash definitions to one argument (value)
    //if you need to access key/index, you'll need to convert the function to it's uncapped form
    //Below the code used convert to access index, which is needed to determine if an element is positioned at the ends of a row
    //Above fact is needed to determine proper styling of element.
    return map.convert({cap: false})((bucket, index) => {
      const additionalLabelStyle = index === 0 && elementLength > 1? startElementStyle :
        index === elementLength - 1 && elementLength > 1 ? endElementStyle : middleElementStyle;
      const { key } = bucket;
      const finalVotes = extractDacFinalVotesFromBucket(bucket, currentUser, adminPage);
      return h(VoteResultBox, { label: key, votes: finalVotes, additionalLabelStyle }, []);
    })(row);
  };

  const loadingTemplate = div({
    className: 'vote-summary-loading-placeholder',
    style: {
      display: 'flex',
      justifyContent: 'start',
      marginBottom: '2%',
      columnGap: '0.5rem',
    }
  }, map((value) =>
    div({
      className: 'text-placeholder',
      key: `vote-result-${value}-placeholder`,
      style: {
        height: '4rem',
        width: '15rem',
      }
    })
  )(range(0, 2)));

  return !isLoading ?
    div({
      className: 'vote-summary-header-component'
    }, [
      span({style: {color: '#777777'}}, ['Final Vote Summary']),
      rowTemplate(chunkedBuckets),
      h(ReactTooltip, {
        id: 'vote-result',
        place: 'bottom',
        effect: 'solid',
        multiline: true,
        className: 'tooltip-wrapper'
      })
    ]) :
    loadingTemplate;
}