import {div, span} from "react-hyperscript-helpers";
import ld from "lodash";

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
    fontSize: '5rem'
  }

};

const dataUseDescriptions = (translatedDataUse) => {
  const descriptions = ld.flatMap(ld.keys(translatedDataUse), key => {
    const dataUses = translatedDataUse[key];
    if (!ld.isEmpty(dataUses)) {
      return ld.map(dataUses, dataUse => {
        return div([dataUse.description]);
      });
    }
  });
  return div({className: 'data_use_descriptions', style: styles.text}, [descriptions]);
};


export default function DataUseBox(props) {
  const {translatedDataUse} = props;

  return div({className: 'data_use_description_box', style: styles.box}, [
    span({style: styles.exclamationPoint}, ['!']),
    dataUseDescriptions(translatedDataUse)
  ]);
}