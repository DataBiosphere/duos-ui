import {React} from 'react';
import { formatDate } from '../libs/utils';
import{ isEmpty, isNil } from 'lodash/fp';

export default function CollectionAlgorithmDecision(props) {
  const {algorithmResult = {}, styleOverride = {}} = props;
  const { createDate, id, result, rationales} = algorithmResult;

  function YesResult() {
    return (<span style={{color: 'rgb(31,163,113)'}}><strong>YES</strong></span>);
  }

  function NoResult() {
    return (<span style={{color: 'rgb(218,0,3)'}}><strong>NO</strong></span>);
  }

  function AbstainResult() {
    return (<span style={{color: '#0948B7'}}><strong>ABSTAIN</strong></span>);
  }

  function OtherResult(props) {
    const { text } = props;
    return (<span><strong>{text}</strong></span>);
  }

  function getResult(result) {
    if (result && result.toLowerCase().trim() === 'abstain') {
      return <AbstainResult/>;
    }
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
        width: '100%',
      },
      styleOverride
    )
  };

  return (
    <div {...containerProps}>
      <div style={{flex: 1, padding: '1%'}}>
        <h5 id={`collection-${id}-subtitle`} style={{fontFamily: 'Montserrat', fontWeight: 800, fontSize: 17, color: '#333F52'}}>DUOS Algorithm Decision</h5>
        <div style={{fontSize: '1.5rem'}}>
          <span id={`collection-${id}-decision-label`} style={{paddingRight: '1%', color: '#333F52'}}>Decision:</span>
          <span id={`collection-${id}-decision-value`} style={{fontWeight: 400}}>{getResult(result)}</span>
        </div>
        <div style={{fontSize: '1.5rem'}}>
          <span id={`collection-${id}-reason-label`} style={{paddingRight: '1%', color: '#333F52'}}>Reason:</span>
          <span id={`collection-${id}-reason-value`} style={{fontWeight: 400}}>
            {!isEmpty(rationales) ? rationales.map((r, idx) => <p key={idx}>{r}</p>) : 'N/A'}
          </span>
        </div>
        <div style={{fontSize: '1.5rem'}}>
          <span id={`collection-${id}-date-label`} style={{paddingRight: '1%', color: '#333F52'}}>Date:</span>
          <span id={`collection-${id}-date-value`} style={{fontWeight: 400}}>{!isNil(createDate) ? formatDate(createDate) : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}