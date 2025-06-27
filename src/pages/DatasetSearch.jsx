import React from 'react';
import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { toLower } from 'lodash';
import { Notifications } from 'src/libs/utils';
import { DataSet } from 'src/libs/ajax/DataSet';
import DatasetSearchTable from 'src/components/data_search/DatasetSearchTable';
import broadIcon from 'src/logo.svg';
import duosIcon from 'src/images/duos-network-logo.svg';
import mgbIcon from 'src/images/mass-general-brigham-logo.svg';
import elwaziIcon from 'src/images/elwazi-logo-color.svg';
import nhgriIcon from 'src/images/nhgri-logo-color.svg';
import anvilIcon from 'src/images/anvil-logo.svg';
import terraIcon from 'src/images/terra-logo.svg';
import hcaIcon from 'src/images/human-cell-atlas-logo.png';
import ifgcIcon from 'src/images/IFGC-logo.png';
import cfdeIcon from 'src/images/cfde-logo.png';
import firecloudIcon from 'src/images/firecloud-logo.png';
import zoonomicsIcon from 'src/images/ZoonomicsLogoColor.png';
import aouIcon from 'src/images/aou-logo.png';
import stanleyIcon from 'src/images/stanley-center-logo.png';
import getzLabIcon from 'src/images/getz-lab-logo.svg';
import asapIcon from 'src/images/asap-logo.svg';
import homeIcon from 'src/images/icon_dataset_.png';
import { Storage } from 'src/libs/storage';
import { Metrics } from 'src/libs/ajax/Metrics';
import eventList from 'src/libs/events';

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
  const [queryState, setQueryState] = useState(query);
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
    'zoonomics': {
      query: {
        'match_phrase': {
          'study.description': 'zoonomics'
        }
      },
      icon: zoonomicsIcon,
      title: 'Center for Zoonomics Data Library',
    },
    'terra': {
      query: null,
      icon: terraIcon,
      title: 'Terra Data Library',
    },
    'cfde': {
      query: {
        'match_phrase': {
          'study.description': 'cfde'
        }
      },
      icon: cfdeIcon,
      title: 'CFDE Data Library',
    },
    'firecloud': {
      query: {
        'match_phrase': {
          'study.description': 'FireCloud'
        }
      },
      icon: firecloudIcon,
      title: 'FireCloud Data Library',
    },
    'allofus': {
      query: {
        'match_phrase': {
          'study.description': 'All of Us'
        }
      },
      icon: aouIcon,
      title: 'All of Us Data Library',
    },
    'openaccess': {
      query: {
        'bool': {
          'should': [
            {
              'term': {
                'accessManagement': 'open'
              }
            }
          ]
        }
      },
      icon: duosIcon,
      title: 'DUOS Open Access Data Library',
    },
    'ifgc': {
      query: {
        'match_phrase': {
          'study.description': 'International Fetal Genomics Consortium'
        }
      },
      icon: ifgcIcon,
      title: 'International Fetal Genomics Consortium Data Library',
    },
    'stanley': {
      query: {
        'match_phrase': {
          'study.description': 'Stanley Center'
        }
      },
      icon: stanleyIcon,
      title: 'Stanley Center Data Library',
    },
    'stanleycenter': {
      query: {
        'match_phrase': {
          'study.description': 'Stanley Center'
        }
      },
      icon: stanleyIcon,
      title: 'Stanley Center Data Library',
    },
    'getzlab': {
      query: {
        'match_phrase': {
          'study.description': 'Getz Lab'
        }
      },
      icon: getzLabIcon,
      title: 'Getz Lab Data Library',
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

  const hasChangedPage = query !== queryState;

  useEffect(() => {
    const init = async () => {
      if (key === '/datalibrary') {
        // noinspection ES6MissingAwait
        Metrics.captureEvent(eventList.dataLibrary);
      } else {
        const brand = key.replaceAll('/', '').toLowerCase();
        // noinspection ES6MissingAwait
        Metrics.captureEvent(eventList.dataLibrary, { brand: brand });
      }
    };
    init();
  }, [key]);

  useEffect(() => {
    const init = async () => {
      if (loading || hasChangedPage) {
        if (isInstitutionSet) {
          Notifications.showError({ text: 'You must set an institution in your profile to view the `myinstitution` data library' });
          props.history.push('/profile');
          return;
        }
        try {
          await DataSet.searchDatasetIndex(fullQuery).then((datasets) => {
            setDatasets(datasets);
            setLoading(false);
            setQueryState(query);
          });
        } catch (_error) {
          Notifications.showError({ text: 'Failed to load Elasticsearch index' });
        }
      }
    };
    init();
  }, [loading, isInstitutionSet, fullQuery, props.history, hasChangedPage]);

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
