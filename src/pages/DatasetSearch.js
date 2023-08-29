import React from 'react';
import { useEffect, useState } from 'react';
import { Notifications } from '../libs/utils';
import { DataSet } from '../libs/ajax';
import DatasetSearchTable from '../components/data_search/DatasetSearchTable';

export const DatasetSearch = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [datasets, setDatasets] = useState([]);

  useEffect(() => {
    const init = async () => {
      const query = {
        'from': 0,
        'size': 10000,
        'query': {
          'bool': {
            'must': [
              {
                'match': {
                  '_type': 'dataset'
                }
              },
              {
                'exists': {
                  'field': 'study'
                }
              }
            ]
          }
        }
      };
      try {
        await DataSet.searchDatasetIndex(query).then((datasets) => {
          setDatasets(datasets);
        });
      } catch (error) {
        Notifications.showError({ text: 'Failed to load Elasticsearch index' });
      }
      setIsLoading(false);
    };
    init();
  }, []);

  return (
    <DatasetSearchTable {...props} datasets={datasets} isLoading={isLoading} />
  );
};

export default DatasetSearch;
