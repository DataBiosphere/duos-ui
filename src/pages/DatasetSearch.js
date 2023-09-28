import React from 'react';
import { useEffect, useState } from 'react';
import { Notifications } from '../libs/utils';
import { DataSet } from '../libs/ajax';
import DatasetSearchTable from '../components/data_search/DatasetSearchTable';
import broadIcon from '../logo.svg';
import duosIcon from '../images/duos-network-logo.svg';
import mgbIcon from '../images/mass-general-brigham-logo.svg';
import elwaziIcon from '../images/elwazi-logo-color.svg';
import { Storage } from '../libs/storage';

export const DatasetSearch = (props) => {
  const { location } = props;
  const [datasets, setDatasets] = useState([]);
  const user = Storage.getCurrentUser();

  // branded study table versions
  const versions = {
    '/datalibrary': {
      query: null,
      icon: duosIcon,
      title: 'DUOS Data Library',
    },
    '/datalibrary_broad': {
      query: {
        'match_phrase': {
          'submitter.institution.name': 'The Broad Institute of MIT and Harvard'
        }
      },
      icon: broadIcon,
      title: 'Broad Data Library',
    },
    '/datalibrary_mgb': {
      query: {
        'bool': {
          'should': [
            {
              'match_phrase': {
                'submitter.institution.name': 'Massachusetts General Hospital'
              }
            },
            {
              'match_phrase': {
                'submitter.institution.name': 'Brigham and Women\'s Hospital'
              }
            },
            {
              'match_phrase': {
                'submitter.institution.name': 'Faulkner Hospital' // TODO: identify exact name
              }
            },
            {
              'match_phrase': {
                'submitter.institution.name': 'Spaulding Hospital' // TODO: identify exact name
              }
            }
          ]
        }
      },
      icon: mgbIcon,
      title: 'Mass General Brigham Data Library',
    },
    '/datalibrary_elwazi': {
      query: {
        'match_phrase': {
          'submitter.institution.name': 'eLwazi'
        }
      },
      icon: elwaziIcon,
      title: 'eLwazi Data Library',
    },
    '/datalibrary_myinstitution': {
      query: {
        'match_phrase': {
          'submitter.institution.name': user.isSigningOfficial ? user.institution.name : null
        }
      },
      icon: null,
      title: user.institution.name + ' Data Library',
    },
  }

  const version = versions[location.pathname];

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
              version.query,
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
    <DatasetSearchTable {...props} datasets={datasets} icon={version.icon} title={version.title} />
  );
};

export default DatasetSearch;
