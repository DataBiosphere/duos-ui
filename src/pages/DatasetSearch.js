import React from 'react';
import { useEffect, useState } from 'react';
import { Notifications } from '../libs/utils';
import { DataSet } from '../libs/ajax';
import DatasetSearchTable from '../components/data_search/DatasetSearchTable';

export const DatasetSearch = (props) => {
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
                'match': {
                  'submitter.institution.id': '150' // Broad Institute of MIT and Harvard
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
    };
    init();
  }, []);

  return (
    <DatasetSearchTable {...props} datasets={datasets} />
  );
};

export default DatasetSearch;
