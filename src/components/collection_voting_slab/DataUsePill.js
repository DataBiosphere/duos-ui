import {div, span} from 'react-hyperscript-helpers';
import {isNil} from 'lodash';
import {map} from 'lodash/fp';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    margin: '1rem 0 1rem 0',
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center'
  },
  code: {
    color: '#FFFFFF',
    backgroundColor: '#0948B7',
    fontWeight: 'bold',
    height: '32px',
    minWidth: '53px',
    borderRadius: '5rem',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex'
  },
  description: {
    color: '#333F52',
    fontWeight: '500',
  }
};


export function DataUsePill(props) {
  const {dataUse} = props;

  return div({key: `data_use_pill_${dataUse.code}`, style: styles.baseStyle}, [
    span({ style: styles.code }, !isNil(dataUse) ? [dataUse.code] : []),
    span({ style: styles.description }, !isNil(dataUse) ? [dataUse.description] : [])
  ]);
}

export function DataUsePills(dataUses){
  return map( dataUse => {
    return DataUsePill({
      dataUse,
      key: dataUse.code
    });
  })(dataUses);
}