import * as React from 'react';
import _ from 'lodash';
import { Box, Button, Link } from '@mui/material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { groupBy, isEmpty } from 'lodash';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';
import DatasetExportButton from './DatasetExportButton';
import { DAR, TerraDataRepo, DataSet } from '../../libs/ajax';
import { Config } from '../../libs/config';
import DatasetFilterList from './DatasetFilterList';
import { Notifications } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import isEqual from 'lodash/isEqual';


const studyTableHeader = [
  'Study Name',
  'Description',
  'Datasets',
  'Participants',
  'Phenotype',
  'Species',
  'PI Name',
  'Data Custodian',
];

const datasetTableHeader = [
  'DUOS ID',
  'Data Use',
  'Data Types',
  'Participants',
  'Data Location',
  'DAC',
  'Export to Terra',
];

export const DatasetSearchTable = (props) => {
  const { datasets, history, icon, title } = props;
  const [filters, setFilters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tableData, setTableData] = useState({});
  const [selected, setSelected] = useState([]);
  const [exportableDatasets, setExportableDatasets] = useState({}); // datasetId -> snapshot
  const [tdrApiUrl, setTdrApiUrl] = useState('');
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
          "multi_match": {
              "query": searchTerm,
              "type":"phrase_prefix",
              "fields": [
                  "datasetName",
                  "dataLocation",
                  "study.description",
                  "study.studyName",
                  "study.species",
                  "study.piName",
                  "study.dataCustodianEmail",
                  "study.dataTypes",
                  "dataUse.primary.code",
                  "dataUse.secondary.code",
                  "dac.dacName",
                  "datasetIdentifier"
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
          "term": {
            "accessManagement": term
          }
        });
      });
    
      if (shouldTerms.length > 0) {
        filterQuery = [
          {
            "bool": {
              "should": shouldTerms
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
          setFiltered(datasets.filter(value => filteredDatasets.some(item => isEqual(item, value))));
        });
      } catch (error) {
        Notifications.showError({ text: 'Failed to load Elasticsearch index' });
      }
    };
    search();
  };
  


  const selectHandler = (event, data, selector) => {
    let idsToModify = [];
    if (selector === 'all') {
      data.rows.forEach((row) => {
        row.subtable.rows.forEach((subRow) => {
          idsToModify.push(subRow.id);
        });
      });
    } else if (selector === 'row') {
      data.subtable.rows.forEach((row) => {
        idsToModify.push(row.id);
      });
    } else if (selector === 'subrow') {
      idsToModify.push(data.id);
    }

    let newSelected = [];
    const allSelected = idsToModify.every((id) => selected.includes(id));
    if (allSelected) {
      newSelected = selected.filter((id) => !idsToModify.includes(id));
    } else {
      newSelected = selected.concat(idsToModify);
    }

    setSelected(newSelected);
  };

  const getExportableDatasets = async (event, data) => {
      setTdrApiUrl(await Config.getTdrApiUrl());
      // Note the dataset id is the first column in subrows.
      // If columns are ever reordereable, this will need to be updated to be not hardcoded to look for the first column.
      const datasetIds = data.subtable.rows.map((row) => row.data[0].value);
      const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIds);
      if (snapshots.filteredTotal > 0) {
        const datasetIdToSnapshot = _.chain(snapshots.items)
          // Ignore any snapshots that a user does not have export (steward or reader) to
          .filter((snapshot) => _.intersection(snapshots.roleMap[snapshot.id], ['steward', 'reader']).length > 0)
          .groupBy('duosId')
          .value();
        setExportableDatasets(datasetIdToSnapshot);
      }
  };

  const expandHandler = async (event, data) => {
    try {
      getExportableDatasets(event, data);
    } catch {
      Notifications.showError({ text: 'Unable to retrieve exportable datasets from Terra' });
    }
  };

  const collapseHandler = () => {
    setExportableDatasets({});
  };

  const applyForAccess = async () => {
    const draftDatasets = selected.map((id) => parseInt(id.replace('dataset-', '')));
    const darDraft = await DAR.postDarDraft({ datasetId: draftDatasets });
    history.push(`/dar_application/${darDraft.referenceId}`);
  };

  const clearSearchRef = () => {
    searchRef.current.value = '';
    filterHandler(null, datasets, '', '');
  }

  useEffect(() => {
    if (isEmpty(filtered)) {
      return;
    }

    const studies = groupBy(filtered, 'study.studyId');
    const table = {
      id: 'study-table',
      headers: studyTableHeader.map((header) => ({ value: header })),
      rows: Object.values(studies).map((entry) => {
        const sum = entry.reduce((acc, dataset) => {
          return acc + dataset.participantCount;
        }, 0);
        return {
          id: 'study-' + entry[0].study.studyId,
          data: [
            {
              value: entry[0].study.studyName,
              truncate: true,
              increaseWidth: true,
            },
            {
              value: entry[0].study.description,
              hideUnderIcon: true,
            },
            {
              value: entry.length,
              truncate: true,
            },
            {
              value: isNaN(sum) ? undefined : sum,
              truncate: true,
            },
            {
              value: entry[0].study.phenotype,
              truncate: true,
            },
            {
              value: entry[0].study.species,
              truncate: true,
            },
            {
              value: entry[0].study.piName,
              truncate: true,
            },
            {
              value: entry[0].study.dataCustodianEmail?.join(', '),
              truncate: true,
            },
          ],
          subtable: {
            headers: datasetTableHeader.map((header) => ({ value: header })),
            rows: entry.map((dataset) => {
              return {
                id: 'dataset-' + dataset.datasetId,
                data: [
                  {
                    value: dataset.datasetIdentifier,
                    increaseWidth: true,
                  },
                  {
                    value: dataset.dataUse?.primary.map((use) => use.code).join(', ')
                  },
                  {
                    value: dataset.dataTypes,
                  },
                  {
                    value: dataset.participantCount,
                  },
                  {
                    value: () => {
                      const exportableSnapshots = exportableDatasets[dataset.datasetIdentifier] || [];
                      if (exportableSnapshots.length === 0) {
                        return dataset.dataLocation;
                      }
                      return exportableSnapshots.map((snapshot, i) =>
                        <Link
                          key={`${i}`}
                          href={`${tdrApiUrl}/snapshots/${snapshot.id}`}
                          target="_blank"
                        >
                          {snapshot.name}
                        </Link>);
                    }
                  },
                  {
                    value: dataset.dac?.dacEmail ? <Link href={'mailto:' + dataset.dac.dacEmail}>{dataset.dac?.dacName}</Link> : dataset.dac?.dacName,
                  },
                  {
                    value: () => {
                      const exportableSnapshots = exportableDatasets[dataset.datasetIdentifier] || [];
                      return exportableSnapshots
                        .map((snapshot, i) =>
                          <DatasetExportButton
                            key={`${i}`}
                            snapshot={snapshot}
                            title={`Export snapshot ${snapshot.name}`} />);
                    }
                  },
                ],
              };
            }),
          }
        };
      }),
    };

    setTableData(table);
  }, [filtered, exportableDatasets, tdrApiUrl]);

  useEffect(() => {
    setFiltered(datasets);
  }, [datasets]);

  return (
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
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: '1em' }}>
            <Button variant="contained" onClick={clearSearchRef}>
                Clear Search
            </Button>
          </Box>
        </div>
      </Box>
      <Box sx={{display: 'flex', flexDirection: 'row', paddingTop: '2em'}}>
        <Box sx={{width: '14%', padding: '0 1em'}}>
          <DatasetFilterList datasets={datasets} filters={filters} filterHandler={filterHandler} searchRef={searchRef}/>
        </Box>
        <Box sx={{width: '85%', padding: '0 1em'}}>
          {
            isEmpty(datasets) ?
              <Box sx={{
                display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <h1>No datasets registered for this library.</h1>
              </Box>
              :
              isEmpty(filtered) ?
              <Box sx={{
                display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <h1>There are no datasets that fit these criteria.</h1>
              </Box>
              :
              isEmpty(filtered) ?
              <Box sx={{
                display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <h1>There are no datasets that fit these criteria.</h1>
              </Box>
              :
              <CollapsibleTable
                data={tableData}
                selected={selected}
                selectHandler={selectHandler}
                expandHandler={expandHandler}
                collapseHandler={collapseHandler}
                summary='faceted study search table'
              />
          }
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
  );
};

export default DatasetSearchTable;
