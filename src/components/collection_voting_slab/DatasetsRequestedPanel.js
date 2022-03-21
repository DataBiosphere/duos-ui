import {div} from "react-hyperscript-helpers";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 0 4px 4px',
    borderBottom: '4px #646464 solid',
    padding: '15px 25px'
  }
}

export default function DatasetsRequestedPanel(props) {
  const {collection} = props;

  return div({style: styles.baseStyle}, [
    "Hello"
    ]);
}