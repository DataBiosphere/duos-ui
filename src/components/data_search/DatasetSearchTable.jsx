import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useOnMount from '@mui/utils/useOnMount';
import * as React from 'react';
import { Box, Button } from '@mui/material';
import {useEffect, useRef, useState} from 'react';
import { isArray, isEmpty, chain, intersection, clone, capitalize, debounce, isEqual } from 'lodash';
import { defaultFilters } from './DatasetFilterConstants';
import { TerraDataRepo } from '../../libs/ajax/TerraDataRepo';
import { DatasetSearchTableDisplay } from './DatasetSearchTableDisplay';
import { datasetSearchTableTabs } from './DatasetSearchTableConstants';
import TableHeaderSection from '../TableHeaderSection';
import { DataSet } from '../../libs/ajax/DataSet';
import { DAR } from '../../libs/ajax/DAR';
import DatasetFilterList from './DatasetFilterList';
import { Notifications } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import {DatasetSearchFooter} from './DatasetSearchFooter';

const styles = {
  subTab: {
    padding: '0 25px',
    fontSize: '15px',
    textTransform: 'none',
    fontFamily: 'Montserrat, sans-serif',
    color: '#00609f',
  },
  subTabActive: {
    fontWeight: 'bold',
    borderBottom: `5px solid #00609f`
  },
};

export const applyForAccess = async (selected, history) => {
  try {
    const draftResponse = await DAR.postDarDraft({ datasetId: selected });
    if (draftResponse.referenceId) {
      history.push(`/dar_application/${draftResponse.referenceId}`);
    } else if (draftResponse.code && draftResponse.code===422) {
      Notifications.showError(
          {
            text: "Please register in DUOS with your institution's email and obtain approval from your Signing Official in order to submit a data access request.",
            severity: 'error',
            timeout: 6000,
            layout: {
              vertical: 'bottom',
              horizontal: 'right'
            }
          }
      );
    } else {
      Notifications.showError({ text: 'Error: Unable to create a Draft Data Access Request' });
    }
  } catch (_error) {
    Notifications.showError({ text: 'Error: Unable to create a Draft Data Access Request' });
  }
};

export const DatasetSearchTable = (props) => {
  const { datasets, history, icon, title } = props;
  const [exportableDatasets, setExportableDatasets] = useState({});
  const [filters, setFilters] = useState(defaultFilters(datasets));
  const [filtered, setFiltered] = useState(datasets);
  const [selected, setSelected] = useState([]);
  const [selectedTable, setSelectedTable] = useState(datasetSearchTableTabs.study);
  const [searchTerm, setSearchTerm] = useState('');

  const isFilteredArray = (filter, category) => (filters[category]).indexOf(filter) > -1;

  const anyFiltersSelected = (filters) =>
    Object.values(filters).some(filter => {
      return isArray(filter) ? filter.length > 0 : filter !== null;
    });

  const getExportableDatasets = async (datasets) => {
    // Note the dataset identifier is in each sub-table row.
    const datasetIdentifiers = datasets.map((row) => row.datasetIdentifier);
    const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers);
    if (snapshots.filteredTotal > 0) {
      const datasetIdToSnapshot = chain(snapshots.items)
        // Ignore any snapshots that a user does not have export (steward or reader) to
        .filter((snapshot) => intersection(snapshots.roleMap[snapshot.id], ['steward', 'reader']).length > 0)
        .groupBy('duosId')
        .value();
      setExportableDatasets(datasetIdToSnapshot);
    }
  };

  const assembleFullQuery = () => {
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

    // do not apply search modifier if there is no search term
    if (searchTerm.length > 0) {
      const searchModifier = [
        {
          'multi_match': {
            'query': searchTerm,
            'type':'phrase_prefix',
            'fields': [
              'datasetName',
              'dataLocation',
              'study.description',
              'study.studyName',
              'study.species',
              'study.piName',
              'study.dataCustodianEmail',
              'study.dataTypes',
              'dataUse.primary.code',
              'dataUse.secondary.code',
              'dac.dacName',
              'datasetIdentifier'
            ]
          }
        }
      ];
      queryChunks.push(...searchModifier);
    }

    let filterQuery = {};
    if (anyFiltersSelected(filters)) {
      const filterTerms = [];

      filterTerms.push({
        'bool': {
          'should':
              filters.accessManagement.map(term => ({
                'term': {
                  'accessManagement': term
                }
              }))
        }
      });

      filterTerms.push({
        'bool': {
          'should':
              filters.dataUse.map(term => ({
                'match': {
                  'dataUse.primary.code': term
                }
              }))
        }
      });

      filterTerms.push({
        'bool': {
          'should':
              filters.dataType.map(term => ({
                'match': {
                  'study.dataTypes': term
                }
              }))
        }
      });

      filterTerms.push({
        'bool': {
          'should':
              filters.dac.map(term => ({
                'match_phrase': {
                  'dac.dacName': term
                }
              }))
        }
      });

      filterTerms.push({
        'range': {
          'participantCount': {
            'gte': filters.participantCountMin,
            'lte': filters.participantCountMax,
          }
        }
      });

      if (filterTerms.length > 0) {
        filterQuery = [
          {
            'bool': {
              'must': filterTerms
            }
          }
        ];
      }
    }

    return {
      'from': 0,
      'size': 10000,
      'query': {
        'bool': {
          'must': queryChunks,
          // Only add filter subquery when filters are applied.
          ...(Object.keys(filterQuery).length > 0 && { 'filter': filterQuery })
        }
      }
    };
  };

  const filterHandler = (category, filter) => {
    let newFilter;
    if (isArray(filters[category])) {
      if (!isFilteredArray(filter, category) && filter !== '') {
        newFilter = filters[category].concat(filter);
      } else {
        newFilter = filters[category].filter((f) => f !== filter);
      }
    } else {
      newFilter = filter;
    }
    const newFilters = clone(filters);
    newFilters[category] = newFilter;
    setFilters(newFilters);
  };



  useOnMount(() => {
    if (isEmpty(datasets)) {
      return;
    }
    getExportableDatasets(datasets);
  });

  const searchAndFilter = useRef(
    debounce((fullQuery) => {
      DataSet.searchDatasetIndex(fullQuery).then((filteredDatasets) => {
        const newFiltered = datasets.filter(value => filteredDatasets.some(item => isEqual(item, value)));
        setFiltered(newFiltered);
      });
    }, 150));

  useEffect(() => {
    const fullQuery = assembleFullQuery();
    try {
      searchAndFilter.current(fullQuery);
    } catch (_error) {
      Notifications.showError({ text: 'Failed to load Elasticsearch index' });
    }  }, [filters, searchTerm]); // eslint-disable-line

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <TableHeaderSection icon={icon} title={title} description="Search, filter, and select datasets, then click 'Apply for Access' to request access" />
        <Box sx={{paddingTop: '2em', paddingLeft: '2em'}}>
          <div className='right-header-section' style={Styles.RIGHT_HEADER_SECTION}>
            <input
              data-cy='search-bar'
              type='text'
              placeholder='Enter search terms'
              style={{
                width: '100%',
                border: '1px solid #cecece',
                backgroundColor: '#f3f6f7',
                borderRadius: '5px',
                height: '4rem',
                paddingLeft: '2%',
                fontFamily: 'Montserrat',
                fontSize: '1.5rem'
              }}
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
            />
            <div/>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: '1em', height: '4rem' }}>
              <Button variant='contained' onClick={() => setSearchTerm('')} sx={{ width: '100px' }}>
                Clear Search
              </Button>
            </Box>
          </div>
        </Box>
        <Box sx={{display: 'flex', flexDirection: 'row', padding: '0 5rem', marginTop: '1rem', borderBottom: '1px solid black'}}>
          <Tabs
            value={false}
            orientation={'horizontal'}
            TabIndicatorProps={{ style: { background: '#00609f' } }}
          >
            {Object.values(datasetSearchTableTabs).map((tab) => <Tab
              key={tab.key}
              label={`View By ${capitalize(tab.plural)}`}
              style={{
                ...styles.subTab,
                ...(tab.key === selectedTable.key ? styles.subTabActive : {})
              }}
              onClick={() => setSelectedTable(tab)}
              component={Button}
            />)}
          </Tabs>
        </Box>
        <Box sx={{display: 'flex', flexDirection: 'row', paddingTop: '2em'}}>
          <Box sx={{width: '14%', padding: '0 1em'}}>
            <DatasetFilterList datasets={datasets} filterHandler={filterHandler} filters={filters} isFiltered={isFilteredArray} onClear={() => setFilters(defaultFilters(datasets))}/>
          </Box>
          <Box sx={{width: '85%', padding: '0 1em'}}>
            {(() => {
              if (isEmpty(datasets)) {
                return (
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <h1>No datasets registered for this library.</h1>
                  </Box>
                );
              } else {
                return <DatasetSearchTableDisplay tab={selectedTable} onSelect={setSelected} filteredData={filtered} selected={selected} exportableDatasets={exportableDatasets}/>;
              }
            })()}
          </Box>
        </Box>
        <Box sx={{padding: '1em'}}/>
        {!isEmpty(selected) && <DatasetSearchFooter selectedDatasets={selected} datasets={datasets} onClick={() => applyForAccess(selected, history)}/>}
      </Box>
    </>
  );
};

export default DatasetSearchTable;
