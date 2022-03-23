import {a, div, h, span} from "react-hyperscript-helpers";
import {useEffect, useState} from "react";
import {isNil, flatMapDeep, filter, includes, map, find} from "lodash";

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
  datasetList: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '0.75rem'
  },
  link: {
    color: '#0948B7',
    fontWeight: '500',
  },
  skeletonLoader: {
    height: '30px',
    width: '60%'
  }
};

export default function DatasetsRequestedPanel(props) {
  const [filteredDatasets, setFilteredDatasets] = useState([]);
  const [visibleDatasets, setVisibleDatasets] = useState([]);
  const [datasetCount, setDatasetCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const collapsedDatasetCapacity = 5;
  const {bucket, dacDatasets, isLoading} = props;

  useEffect(() => {
    const datasets = datasetsForDacInBucket();
    setFilteredDatasets(datasets);
    setDatasetCount(datasets.length);
    collapseView(datasets);
  }, [bucket, dacDatasets]);

  const datasetsForDacInBucket = () => {
    const bucketElections = (!isNil(bucket) && !isNil(bucket.elections)) ? bucket.elections : [];
    const bucketDatasetIds = flatMapDeep(bucketElections, election => {
      return flatMapDeep(election, e =>  e.dataSetId);
    });

    return filter(dacDatasets, dacDataset => {
      return includes(bucketDatasetIds, dacDataset.dataSetId);
    });
  };

  const collapseView = (datasets) => {
    const datasetsHiddenWhenCollapsed = datasets.length > collapsedDatasetCapacity;

    const collapsedViewDatasets = datasetsHiddenWhenCollapsed ?
      datasets.slice(0, collapsedDatasetCapacity) :
      datasets;

    setVisibleDatasets(collapsedViewDatasets);
  };

  const SectionHeading = () => {
    return div({style: styles.heading}, [
      'Datasets Requested',
      span({
        style: styles.datasetCount,
        isRendered: !isLoading,
        dataCy: 'dataset-count'
      }, [`(${datasetCount})`])
    ]);
  };

  const DatasetList = () => {
    const datasetRows = map(visibleDatasets, dataset => {
      return div({style: {display: 'flex'}}, [
        div({style: {width: '12.5%'}}, [datasetId(dataset)]),
        div({style: {width: '75%'}}, [datasetName(dataset)])
      ]);
    });
    return isLoading
      ? div({className: 'text-placeholder', style: styles.skeletonLoader})
      : div({style: styles.datasetList, dataCy: 'dataset-list'}, [datasetRows]);
  };

  const datasetId = (dataset) => {
    return !isNil(dataset.alias) ? dataset.alias : '- -';
  };

  const datasetName = (dataset) => {
    const datasetNameProperty = !isNil(dataset.properties) &&
      find(dataset.properties, property => {
        return property.propertyName === 'Dataset Name';
      });

    return datasetNameProperty ? datasetNameProperty.propertyValue : '- -';
  };

  const CollapseExpandLink = () => {
    const hiddenDatasetCount = datasetCount - collapsedDatasetCapacity;
    const linkMessage = expanded ?
      `- View ${hiddenDatasetCount} less` :
      `+ View ${hiddenDatasetCount} more`;

    return a({
      dataCy: 'collapse-expand-link',
      style: styles.link,
      onClick: expanded ? collapseDatasetList : expandDatasetList,
      isRendered: hiddenDatasetCount > 0
    }, [linkMessage]);
  };

  const expandDatasetList = () => {
    setExpanded(true);
    setVisibleDatasets(filteredDatasets);
  };

  const collapseDatasetList = () => {
    setExpanded(false);
    setVisibleDatasets(filteredDatasets.slice(0, collapsedDatasetCapacity));
  };

  return div({style: styles.baseStyle}, [
    h(SectionHeading),
    h(DatasetList),
    h(CollapseExpandLink)
  ]);
}
