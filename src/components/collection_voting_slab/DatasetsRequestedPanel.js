import {div, span} from "react-hyperscript-helpers";
import {useState} from "react";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 0 4px 4px',
    borderBottom: '4px #646464 solid',
    padding: '15px 25px'
  },
  heading: {
    fontWeight: 'bold'
  }
}

export default function DatasetsRequestedPanel(props) {
  const [collectionDatasets, setCollectionDatasets] = useState([]);
  const {collection, dacDatasets} = props;

  return div({style: styles.baseStyle}, [
    div([
      span({style: styles.heading}, ["Datasets Requested"]),
      "(Number of datasets)"
    ]),
    "Hello"
  ]);
}