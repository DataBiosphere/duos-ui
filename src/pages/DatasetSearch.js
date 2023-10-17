import React from 'react';
import { useEffect, useState } from 'react';
import { Notifications } from '../libs/utils';
import { DataSet } from '../libs/ajax';
import DatasetSearchTable from '../components/data_search/DatasetSearchTable';
import broadIcon from '../logo.svg';
import duosIcon from '../images/duos-network-logo.svg';
import mgbIcon from '../images/mass-general-brigham-logo.svg';
import elwaziIcon from '../images/elwazi-logo-color.svg';
import nhgriIcon from '../images/nhgri-logo-color.svg';
import homeIcon from '../images/icon_dataset_.png';
import { Storage } from '../libs/storage';
import { Box, CircularProgress } from '@mui/material';

const signingOfficialQuery = (user) => {
  return {
    'match_phrase': {
      'submitter.institution.id': user.institution.id
    }
  };
}

// query to return approved DAC studies from the user's institution and open access studies
const myInstitutionQuery = (user) => {
  return {
    'bool': {
      'must': [
        {
          'match_phrase': {
            'submitter.institution.id': user.institution.id
          }
        },
        {
          'term': {
            'dacApproval': true
          }
        }
      ]
    }
  };
}

export const DatasetSearch = (props) => {
  const { match: { params: { query } } } = props;
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = Storage.getCurrentUser();

  // branded study table versions
  const versions = {
    '/datalibrary': {
      query: null,
      icon: duosIcon,
      title: 'DUOS Data Library',
    },
    'broad': {
      query: {
        'match_phrase': {
          'submitter.institution.name': 'The Broad Institute of MIT and Harvard'
        }
      },
      icon: broadIcon,
      title: 'Broad Data Library',
    },
    'mgb': {
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
    'elwazi': {
      query: {
        'match_phrase': {
          'study.description': 'elwazi'
        }
      },
      icon: elwaziIcon,
      title: 'eLwazi Data Library',
    },
    'myinstitution': {
      query: user.isSigningOfficial ? signingOfficialQuery(user) : myInstitutionQuery(user),
      icon: null,
      title: user.institution.name + ' Data Library',
    },
    'nhgri': {
      query: {
        'match_phrase': {
          'study.description': 'anvil'
        }
      },
      icon: nhgriIcon,
      title: 'NHGRI Data Library',
    },
    '/custom': {
      query: {
        'bool': {
          'should': [
            {
              'match_phrase': {
                'study.description': query
              }
            },
            {
              'match_phrase': {
                'submitter.institution.name': query
              }
            },
          ]
        }
      },
      icon: homeIcon,
      title: query + ' Data Library',
    }
  }

  const key = query === undefined ? '/datalibrary' : query;
  const version = versions[key] === undefined ? versions['/custom'] : versions[key];

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
          setLoading(false);
        });
      } catch (error) {
        Notifications.showError({ text: 'Failed to load Elasticsearch index' });
      }
    };
    init();
  }, []);

  return (
    loading ?
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
      :
      <DatasetSearchTable {...props} datasets={datasets} icon={version.icon} title={version.title} />
  );
};

export default DatasetSearch;
