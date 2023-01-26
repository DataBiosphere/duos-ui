import {a, div, h, span} from 'react-hyperscript-helpers';
import {useEffect, useState} from 'react';
import {isNil, filter, includes, map} from 'lodash/fp';

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: '500',
    color: '#333F52',
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
  const {bucketDatasets, dacDatasetIds, isLoading, adminPage} = props;

  useEffect(() => {
    // admins see all datasets in bucket; DACs only see datasets relevant to them
    const datasets = adminPage ?
      bucketDatasets :
      filter(dataset => {
        const { dataSetId } = dataset;
        return includes(dataSetId)(dacDatasetIds);
      })(bucketDatasets);

    setFilteredDatasets(datasets);
    setDatasetCount(datasets.length);
    collapseView(datasets);
  }, [adminPage, bucketDatasets, dacDatasetIds]);

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
        datacy: 'dataset-count'
      }, [`(${datasetCount})`])
    ]);
  };

  const DatasetList = () => {
    const datasetRows = map(dataset => {
      return div({style: {display: 'flex'}, key: dataset.dataSetId, className: 'dataset-list-item'}, [
        div({style: {width: '12.5%'}}, [datasetId(dataset)]),
        div({style: {width: '75%'}}, [datasetName(dataset)])
      ]);
    })(visibleDatasets);

    return isLoading
      ? div({className: 'text-placeholder', style: styles.skeletonLoader})
      : div({style: styles.datasetList, datacy: 'dataset-list'}, [datasetRows]);
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
      datacy: 'collapse-expand-link',
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
