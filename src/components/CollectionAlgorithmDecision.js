import {React} from 'react';
import { div, h5, p, span, } from 'react-hyperscript-helpers';
import { formatDate } from '../libs/utils';
import{ isEmpty, isNil } from 'lodash/fp';

export default function CollectionAlgorithmDecision(props) {
  const {algorithmResult = {}, styleOverride = {}} = props;
  const { createDate, id, result, failureReasons} = algorithmResult;

  function YesResult() {
    return (<span style={{color: 'rgb(31,163,113)'}}><strong>YES</strong></span>);
  }

  function NoResult() {
    return (<span style={{color: 'rgb(218,0,3)'}}><strong>NO</strong></span>);
  }

  function OtherResult(props) {
    const { text } = props;
    return (<span><strong>{text}</strong></span>);
  }

  function getResult(result) {
    if (result && result.trim().length > 0){
      switch (result.toLowerCase().trim()) {
        case 'yes':
          return <YesResult/>;
        case 'no':
          return <NoResult/>;
        default:
      }
    }
    return <OtherResult text={'N/A'}/>;

  }
  const containerProps = {
    id: `collection-algorithm-id-${id}`,
    style: Object.assign(
      {
        padding: '4%',
        justifyContent: 'space-around',
        fontFamily: 'Montserrat',
        width: '50%'
      },
      styleOverride
    )
  };

  return (
    div(containerProps, [
      div({style: {flex: 1,}}, [
        h5({id: `collection-${id}-subtitle`, style: {fontWeight: 800, fontSize: '1.8rem'}}, ['DUOS Algorithm Decision']),
        div({style: {fontSize: '1.5rem'}}, [
          span({id: `collection-${id}-decision-label`, style: {paddingRight: '1%'}}, ['Decision:']),
          span({id: `collection-${id}-decision-value`, style: {fontWeight: 400}}, [getResult(result)])
        ]),
        div({style: {fontSize: '1.5rem'}}, [
          span({id: `collection-${id}-date-label`, style: {paddingRight: '1%'}}, ['Date:']),
          span({id: `collection-${id}-date-value`, style: {fontWeight: 400}}, [!isNil(createDate) ? formatDate(createDate) : 'N/A'])
        ]),
        div({style: {fontSize: '1.5rem'}}, [
          span({id: `collection-${id}-reason-label`, style: {paddingRight: '1%'}}, ['Reason:']),
          span({id: `collection-${id}-reason-value`, style: {fontWeight: 400}},
            [!isEmpty(failureReasons) ? failureReasons.map((r, idx) => p({key: idx}, [r])) : 'N/A'])
        ])
      ])
    ])
  );
}