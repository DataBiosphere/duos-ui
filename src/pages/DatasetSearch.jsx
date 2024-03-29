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
import anvilIcon from '../images/anvil-logo.svg';
import terraIcon from '../images/terra-logo.svg';
import hcaIcon from '../images/human-cell-atlas-logo.png';
import homeIcon from '../images/icon_dataset_.png';
import { Storage } from '../libs/storage';
import { Box, CircularProgress } from '@mui/material';
import { toLower } from 'lodash';

const assembleFullQuery = (isSigningOfficial, isInstitutionQuery, subQuery) => {
  const queryChunks = [
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
  ];

  // do not apply modifier if user is signing official and viewing their own institution
  if (!isSigningOfficial || !isInstitutionQuery) {
    const visibilityModifier = [
      {
        'term': {
          'study.publicVisibility': true
        }
      },
      {
        'bool': {
          'should': [
            {
              'term': {
                'dacApproval': true
              }
            },
            {
              'term': {
                'accessManagement': 'open'
              }
            },
            {
              'term': {
                'accessManagement': 'external'
              }
            }
          ]
        }
      }
    ];
    queryChunks.push(...visibilityModifier);
  }

  if (subQuery !== null) {
    queryChunks.push(subQuery);
  }

  return {
    'from': 0,
    'size': 10000,
    'query': {
      'bool': {
        'must': queryChunks
      }
    }
  };
};

export const DatasetSearch = (props) => {
  const { match: { params: { query } } } = props;
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = Storage.getCurrentUser();

  const isSigningOfficial = user.isSigningOfficial;
  const institutionId = user.institution?.id;
  const institutionName = user.institution?.name;

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
      query: {
        'match_phrase': {
          'submitter.institution.id': institutionId
        }
      },
      icon: null,
      title: institutionName + ' Data Library',
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
    'anvil': {
      query: {
        'match_phrase': {
          'study.description': 'anvil'
        }
      },
      icon: anvilIcon,
      title: 'AnVIL Data Library',
    },
    'hca': {
      query: {
        'match_phrase': {
          'study.description': 'hca dcp'
        }
      },
      icon: hcaIcon,
      title: 'Human Cell Atlas Data Library',
    },
    'terra': {
      query: null,
      icon: terraIcon,
      title: 'Terra Data Library',
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
  };

  const key = query === undefined ? '/datalibrary' : toLower(query);
  const version = versions[key] === undefined ? versions['/custom'] : versions[key];
  const isInstitutionQuery = key === 'myinstitution';

  const fullQuery = assembleFullQuery(isSigningOfficial, isInstitutionQuery, version.query);
  const isInstitutionSet = institutionId === undefined && isInstitutionQuery;

  useEffect(() => {
    const init = async () => {
      if (loading) {
        if (isInstitutionSet) {
          Notifications.showError({ text: 'You must set an institution in your profile to view the `myinstitution` data library' });
          props.history.push('/profile');
          return;
        }
        try {
          await DataSet.searchDatasetIndex(fullQuery).then((datasets) => {
            setDatasets(datasets);
            setLoading(false);
          });
        } catch (error) {
          Notifications.showError({ text: 'Failed to load Elasticsearch index' });
        }
      }
    };
    init();
  }, [loading, isInstitutionSet, fullQuery, props.history]);

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
