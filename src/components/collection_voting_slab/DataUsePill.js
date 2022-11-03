import {div, h2, span} from 'react-hyperscript-helpers';
import {isNil} from 'lodash';
import {map} from 'lodash/fp';
import { ControlledAccessType } from '../../libs/dataUseTranslation';

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

  return div({key: `data_use_pill_${dataUse.type}_${dataUse.code}`, style: styles.baseStyle}, [
    span({ style: styles.code }, !isNil(dataUse) ? [dataUse.code] : []),
    span({ style: styles.description }, !isNil(dataUse) ? [dataUse.description] : [])
  ]);
}

export function DataUsePills(dataUses){
  const permissionsUses = dataUses.filter(dataUse => dataUse.type === ControlledAccessType.permissions);
  const modifierUses = dataUses.filter(dataUse => dataUse.type === ControlledAccessType.modifiers);
  return(
    div([map(dataUse=>{return DataUsePill({dataUse, key: dataUse.code});})(permissionsUses),
      div({isRendered: modifierUses.length > 0},[
        h2(ControlledAccessType.modifiers),
        map(dataUse=>{return DataUsePill({dataUse, key: dataUse.code});})((modifierUses))
      ])
    ])
  );
}