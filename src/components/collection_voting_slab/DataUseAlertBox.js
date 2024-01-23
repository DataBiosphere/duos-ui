import React from 'react';
import {isEmpty, map} from 'lodash/fp';

const styles = {
  box: {
    color: '#DB3214',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Montserrat',
    padding: '1rem',
    margin: '1.5rem',
    border: '2px solid #DB3214',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    columnGap: '1rem',
    width: 'fit-content'
  },
  text: {
    fontSize: '1.6rem',
    fontWeight: '500',
  },
  exclamationPoint: {
    fontSize: '3rem',
    fontWeight: 'bold'
  }
};

const dataUseDescriptions = (translatedDataUse) => {
  return Object.keys(translatedDataUse).flatMap(key => {
    const dataUses = translatedDataUse[key];
    return map.convert({cap: false})((dataUse, index) => {
      const uniqKey = key + '-' + dataUse.code + '-' + index;
      return (
        <div key={uniqKey}>
          {dataUse.description}
        </div>
      );
    })(manuallyReviewedDataUses(dataUses));
  });
};

const manuallyReviewedDataUses = (dataUses) => {
  return dataUses.filter((dataUse) => dataUse.manualReview);
};

export default function DataUseAlertBox(props) {
  const {translatedDataUse} = props;
  const descriptions = dataUseDescriptions(translatedDataUse);

  return (
    /* eslint-disable react/no-unknown-property */
    !isEmpty(descriptions) && <div datacy="alert-box" style={styles.box}>
      <span style={styles.exclamationPoint}>!</span>
      <div style={styles.text}>{descriptions}</div>
    </div>
  );
}
