import {div, span} from "react-hyperscript-helpers";
import {isEmpty, filter, keys, flatMap, map} from "lodash/fp";

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
  return flatMap(key => {
    const dataUses = translatedDataUse[key];
    return map(dataUse => {
      return div({key: dataUse.code}, [dataUse.description]);
    })(manuallyReviewedDataUses(dataUses));
  })(keys(translatedDataUse));
};

const manuallyReviewedDataUses = (dataUses) => {
  return filter(dataUse => dataUse.manualReview)(dataUses);
};

export default function DataUseAlertBox(props) {
  const {translatedDataUse} = props;
  const descriptions = dataUseDescriptions(translatedDataUse);

  return div({datacy: 'alert-box', style: styles.box, isRendered: !isEmpty(descriptions)}, [
    span({style: styles.exclamationPoint}, ['!']),
    div({style: styles.text}, [descriptions])
  ]);
}