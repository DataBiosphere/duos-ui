import {div, span} from "react-hyperscript-helpers";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 0 4px 4px',
    borderBottom: '4px #646464 solid',
    padding: '15px 25px'
  },
  title: {
    fontWeight: 'bold'
  }
}

export default function DatasetsRequestedPanel(props) {
  const [bucketDatasetsForDac, setBucketDatasetsForDac] = useState([]);
  const [datasetCount, setDatasetCount] = useState(0);
  const {bucket, dacDatasets} = props;

  useEffect(() => {
    const bucketElections = !isNil(bucket) ? bucket.elections : [];
    const bucketDatasetIds = ld.flatMapDeep(bucketElections, election => {
     return ld.flatMapDeep(election, dataset =>  dataset.dataSetId)
    });

   const bucketDatasetsForDac = ld.filter(dacDatasets, dacDataset => {
     return ld.includes(bucketDatasetIds, dacDataset.dataSetId)
   });
   setBucketDatasetsForDac(bucketDatasetsForDac);
  }, [bucket, dacDatasets]);


  useEffect(() => {
    setDatasetCount(bucketDatasetsForDac.length);
  }, [bucketDatasetsForDac])

  return div({style: styles.baseStyle}, [
    div([
      span({style: styles.title}, ["Datasets Requested"]),
      "(" + datasetCount + ")"
    ]),
    "Hello"
  ]);
}