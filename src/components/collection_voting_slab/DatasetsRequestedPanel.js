import {div, h, span} from "react-hyperscript-helpers";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";
import {isEmpty} from "lodash/fp";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 0 4px 4px',
    borderBottom: '4px #646464 solid',
    padding: '15px 25px'
  },
  heading: {
    fontWeight: 'bold',
    display: 'flex',
    columnGap: '0.5rem',
    alignItems: 'center'
  },
  datasetCount: {
    color: '#747474',
    fontSize: '1.2rem'
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
  }, [bucketDatasetsForDac]);


  const SectionHeading = () => {
    return div({style: styles.heading}, [
      'Datasets Requested',
      span({style: styles.datasetCount}, [`(${datasetCount})`])
    ]);
  }

  const DatasetList = () => {
    const datasetRows = ld.map(bucketDatasetsForDac, dataset => {
      return div({style: {display: 'flex'}}, [
        div({style: {width: '12.5%'}}, [dataset.alias]),
        div({style: {width: '75%'}}, [datasetName(dataset)])
      ])
    })
    return div([datasetRows]);
  }

  const datasetName = (dataset) => {
    const datasetNameProperty = !isNil(dataset.properties) &&
      ld.find(dataset.properties, property => {
        return property.propertyName === 'Dataset Name'
      });

    return datasetNameProperty ? datasetNameProperty.propertyValue : '- -'
  }

  return div({style: styles.baseStyle}, [
    h(SectionHeading),
    h(DatasetList)
  ]);
}