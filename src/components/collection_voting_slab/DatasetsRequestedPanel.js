import {a, div, h, span} from "react-hyperscript-helpers";
import {useCallback, useEffect, useState} from "react";
import {isNil, filter, includes, map} from "lodash/fp";

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
  const {bucketDatasetIds, dacDatasetIds, collectionDatasets, isLoading} = props;


  const requestedDatasetIds = useCallback(() => {
    const datasetsForDacInBucket =  filter(bucketDatasetId => {
      return includes(bucketDatasetId)(dacDatasetIds);
    })(bucketDatasetIds);

    return filter(dataset => {
      return includes(dataset.datasetId)(datasetsForDacInBucket);
    })(collectionDatasets);
  }, [bucketDatasetIds, collectionDatasets, dacDatasetIds]);

  useEffect(() => {
    const datasets = requestedDatasetIds();
    setFilteredDatasets(datasets);
    setDatasetCount(datasets.length);
    collapseView(datasets);
  }, [requestedDatasetIds]);

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
    const datasetRows = map(dataset => {
      return div({style: {display: 'flex'}}, [
        div({style: {width: '12.5%'}}, [datasetId(dataset)]),
        div({style: {width: '75%'}}, [datasetName(dataset)])
      ]);
    })(visibleDatasets);

    return isLoading
      ? div({className: 'text-placeholder', style: styles.skeletonLoader})
      : div({style: styles.datasetList, dataCy: 'dataset-list'}, [datasetRows]);
  };

  const datasetId = (dataset) => {
    return !isNil(dataset.datasetIdentifier) ? dataset.datasetIdentifier : '- -';
  };

  const datasetName = (dataset) => {
    return !isNil(dataset.name) ? dataset.name : '- -';
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
