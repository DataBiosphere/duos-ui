import React from 'react';
import {isNil} from 'lodash';
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
  subheading: {
    fontWeight: 'bold',
  },
  description: {
    color: '#333F52',
    fontWeight: '500',
  }
};

export const DataUsePill = (props) => {
  const { dataUse, key } = props;

  return (
    <div key={`data_use_pill_${dataUse.type}_${dataUse.code}_${key}`} style={styles.baseStyle}>
      <span style={styles.code}>{!isNil(dataUse) ? [dataUse.code] : []}</span>
      <span style={styles.description}>{!isNil(dataUse) ? [dataUse.description] : []}</span>
    </div>
  );
};

export const DataUsePills = (dataUses) => {
  const permissionsUses = dataUses.filter(dataUse => dataUse.type === ControlledAccessType.permissions);
  const modifierUses = dataUses.filter(dataUse => dataUse.type === ControlledAccessType.modifiers);

  return (
    <div>
      {permissionsUses.map((dataUse, idx) => (
        <DataUsePill dataUse={dataUse} key={`${dataUse.code}-${idx}`} />
      ))}
      {modifierUses.length > 0 && (
        <div>
          <h3 style={styles.subheading}>{ControlledAccessType.modifiers}</h3>
          {modifierUses.map((dataUse, idx) => (
            <DataUsePill dataUse={dataUse} key={`${dataUse.code}-${idx}`} />
          ))}
        </div>
      )}
    </div>
  );
};
