import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import * as React from 'react';
import { Box, Button } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { isEmpty } from 'lodash';
import { DatasetSearchTableDisplay } from './DatasetSearchTableDisplay';
import { datasetSearchTableTabs } from './DatasetSearchTableConstants';
import TableHeaderSection from '../TableHeaderSection';
import { DataSet } from '../../libs/ajax/DataSet';
import { DAR } from '../../libs/ajax/DAR';
import DatasetFilterList from './DatasetFilterList';
import { Notifications } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import isEqual from 'lodash/isEqual';

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



export const DatasetSearchTable = (props) => {
  const { datasets, history, icon, title } = props;
  const [filters, setFilters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [selectedTable, setSelectedTable] = useState(datasetSearchTableTabs.study);
  const searchRef = useRef('');
  const isFiltered = (filter) => filters.indexOf(filter) > -1;

  const assembleFullQuery = (searchTerm, filters) => {
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

    // do not apply search modifier if there is no searchTerm
    if (searchTerm !== '') {
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

    var filterQuery = {};
    if (filters.length > 0) {
      const shouldTerms = [];

      filters.forEach(term => {
        shouldTerms.push({
          'term': {
            'accessManagement': term
          }
        });
      });

      if (shouldTerms.length > 0) {
        filterQuery = [
          {
            'bool': {
              'should': shouldTerms
            }
          }
        ];
      }
    }

    // do not add filter subquery if no filters are applied
    if (filters.length > 0) {
      return {
        'from': 0,
        'size': 10000,
        'query': {
          'bool': {
            'must': queryChunks,
            'filter': filterQuery
          }
        }
      };
    } else {
      return {
        'from': 0,
        'size': 10000,
        'query': {
          'bool': {
            'must': queryChunks
          }
        }
      };
    }
  };

  const filterHandler = (event, data, filter, searchTerm) => {
    var newFilters = [];
    if (!isFiltered(filter) && filter !== '') {
      newFilters = filters.concat(filter);
    } else {
      newFilters = filters.filter((f) => f !== filter);
    }
    setFilters(newFilters);

    const fullQuery = assembleFullQuery(searchTerm, newFilters);
    const search = async () => {
      try {
        await DataSet.searchDatasetIndex(fullQuery).then((filteredDatasets) => {
          var newFiltered = datasets.filter(value => filteredDatasets.some(item => isEqual(item, value)));
          setFiltered(newFiltered);
        });
      } catch (error) {
        Notifications.showError({ text: 'Failed to load Elasticsearch index' });
      }
    };
    search();
  };
  const applyForAccess = async () => {
    const darDraft = await DAR.postDarDraft({ datasetId: selected });
    history.push(`/dar_application/${darDraft.referenceId}`);
  };

  const clearSearchRef = () => {
    searchRef.current.value = '';
    filterHandler(null, datasets, '', '');
  };
  useEffect(() => {
    if (isEmpty(filtered)) {
      return;
    }

  }, [filtered]);

  useEffect(() => {
    setFiltered(datasets);
  }, [datasets]);

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <TableHeaderSection icon={icon} title={title} description="Search, filter, and select datasets, then click 'Apply for Access' to request access" />
        <Box sx={{paddingTop: '2em', paddingLeft: '2em'}}>
          <div className="right-header-section" style={Styles.RIGHT_HEADER_SECTION}>
            <input
              data-cy="search-bar"
              type="text"
              placeholder="Enter search terms"
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
              onChange={() => filterHandler(null, datasets, '', searchRef.current.value)}
              ref={searchRef}
            />
            <div/>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: '1em', height: '4rem' }}>
              <Button variant="contained" onClick={clearSearchRef} sx={{ width: '100px' }}>
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
              label={tab.label}
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
            <DatasetFilterList datasets={datasets} filters={filters} filterHandler={filterHandler} searchRef={searchRef}/>
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
                return <DatasetSearchTableDisplay tab={selectedTable} onSelect={setSelected} filteredData={filtered} selected={selected}/>;
              }
            })()}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2em 4em' }}>
          {
            !isEmpty(datasets) &&
          <Button variant="contained" onClick={applyForAccess} sx={{ transform: 'scale(1.5)' }} >
            Apply for Access
          </Button>
          }
        </Box>
      </Box>
    </>
  );
};

export default DatasetSearchTable;
