import {div, span} from "react-hyperscript-helpers";
import * as ld from "lodash";


const styles = {
  box: {
    backgroundColor: '#FFFFFF',
    color: '#DB3214',
    fontFamily: 'Montserrat',
    padding: '1rem',
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
    fontSize: '5rem'
  }

};

const dataUseDescriptions = (translatedDataUse) => {
  const descriptions = ld.flatMap(ld.keys(translatedDataUse), key => {
    const dataUses = translatedDataUse[key];
    if (!ld.isEmpty(dataUses)) {
      return ld.map(dataUses, dataUse => {
        return div([dataUse.description, '\n']);
      });
    }
  });
  return div({style: styles.text}, [descriptions]);
};


export default function DataUseAlert(props) {
  const {translatedDataUse} = props;

  return div({className: 'data_use_alert', style: styles.box}, [
    span({style: styles.exclamationPoint}, ['!']),
    dataUseDescriptions(translatedDataUse)
  ]);
}