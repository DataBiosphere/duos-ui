import {div, span} from "react-hyperscript-helpers";
import ld, {isEmpty} from "lodash";

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
    fontSize: '8rem',
    fontWeight: 'bold'
  }
};

const dataUseDescriptions = (translatedDataUse) => {
  return ld.flatMap(ld.keys(translatedDataUse), key => {
    const dataUses = translatedDataUse[key];
    return ld.map(manuallyReviewedDataUses(dataUses), dataUse => {
      return div([dataUse.description]);
    });
  });
};

const manuallyReviewedDataUses = (dataUses) => {
  return ld.filter(dataUses, dataUse => {
    return dataUse.manualReview;
  });
};

export default function DataUseAlertBox(props) {
  const {translatedDataUse} = props;
  const descriptions = dataUseDescriptions(translatedDataUse);

  return div({className: 'data-use-alert-box', style: styles.box, isRendered: !isEmpty(descriptions)}, [
    span({style: styles.exclamationPoint}, ['!']),
    div({className: 'data-use-descriptions', style: styles.text}, [descriptions])
  ]);
}