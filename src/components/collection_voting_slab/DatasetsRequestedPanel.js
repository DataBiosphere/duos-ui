import {a, div, h, span} from "react-hyperscript-helpers";
import {useEffect, useState} from "react";
import ld, {isNil} from "lodash";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: '500',
    color: '#333F52',
    backgroundColor: '#F1EDE8',
    borderRadius: '0 0 4px 4px',
    borderBottom: '4px #646464 solid',
    padding: '15px 25px',
    display: 'flex',
    flexDirection: 'column',
    rowGap: '1.5rem'
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
  },
  link: {
    color: '#0948B7',
    fontWeight: '500',
  },
  skeletonLoader: {
    height: '30px',
    width: '60%'
  }
}

export default function DatasetsRequestedPanel(props) {
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [visibleDatasets, setVisibleDatasets] = useState([]);
  const [datasetCount, setDatasetCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const collapsedDatasetCapacity = 5;
  const {bucket, dacDatasets, isLoading} = props;

  useEffect(() => {
    const bucketElections = (!isNil(bucket) && !isNil(bucket.elections)) ? bucket.elections : [];
    const bucketDatasetIds = ld.flatMapDeep(bucketElections, election => {
     return ld.flatMapDeep(election, e =>  e.dataSetId)
    });

    const datasetsForDacInBucket = ld.filter(dacDatasets, dacDataset => {
      return ld.includes(bucketDatasetIds, dacDataset.dataSetId)
    });
    setFilteredDatasets(datasetsForDacInBucket);
  }, [bucket, dacDatasets]);


  useEffect(() => {
    setDatasetCount(filteredDatasets.length);

    const datasetsHiddenWhenCollapsed = datasetCount > collapsedDatasetCapacity;

    datasetsHiddenWhenCollapsed ? setExpanded(false) : setExpanded(true);

    const collapsedViewDatasets = datasetsHiddenWhenCollapsed
      ? filteredDatasets.slice(0, 5)
      : filteredDatasets;

    setVisibleDatasets(collapsedViewDatasets)
  }, [filteredDatasets]);


  const SectionHeading = () => {
    return div({style: styles.heading}, [
      'Datasets Requested',
      span({style: styles.datasetCount, isRendered: !isLoading}, [`(${datasetCount})`])
    ]);
  }

  const DatasetList = () => {
    const datasetRows = ld.map(visibleDatasets, dataset => {
      return div({style: {display: 'flex'}}, [
        div({style: {width: '12.5%'}}, [datasetId(dataset)]),
        div({style: {width: '75%'}}, [datasetName(dataset)])
      ])
    })
    return isLoading
      ? div({className: 'text-placeholder', style: styles.skeletonLoader})
      : div([datasetRows]);
  }

  const datasetId = (dataset) => {
    return !isNil(dataset.alias) ? dataset.alias : '- -'
  }

  const datasetName = (dataset) => {
    const datasetNameProperty = !isNil(dataset.properties) &&
      ld.find(dataset.properties, property => {
        return property.propertyName === 'Dataset Name'
      });

    return datasetNameProperty ? datasetNameProperty.propertyValue : '- -'
  }

  const ExpandLink = () => {
    const hiddenDatasetCount = datasetCount - collapsedDatasetCapacity;

    return a({
      style: styles.link,
      onClick: expandDatasets,
      isRendered: !expanded
    }, [
      `+ View ${hiddenDatasetCount} more`
    ]);
  };

  const expandDatasets = () => {
    setExpanded(true)
    setVisibleDatasets(filteredDatasets)
  }

  return div({style: styles.baseStyle}, [
    h(SectionHeading),
    h(DatasetList),
    h(ExpandLink)
  ]);
}