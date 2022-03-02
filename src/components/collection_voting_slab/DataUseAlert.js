import {div, span} from "react-hyperscript-helpers";


const styles = {
box: {
  border: '2px solid #DB3214',
  borderRadius: '8px',
  backgroundColor: '#FFFFFF'
}

};


export default function DataUseAlert(props) {
  const {translatedDataUse} = props;

  return div({className: 'data_use_alert', style: styles.box}, [
    "ExclamationIcon"
  ]);
}