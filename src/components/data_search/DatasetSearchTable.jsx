import * as React from 'react';
import _ from 'lodash';
import { Box, Button, Link } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { groupBy, isEmpty, concat, compact, map } from 'lodash';
import { DatasetSearchTableDisplay } from './DatasetSearchTableDisplay';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';
import DatasetExportButton from './DatasetExportButton';
import { DataSet } from '../../libs/ajax/DataSet';
import { DAR } from '../../libs/ajax/DAR';
import eventList from '../../libs/events';
import { Config } from '../../libs/config';
import DatasetFilterList from './DatasetFilterList';
import { Metrics } from '../../libs/ajax/Metrics';
import { Notifications } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import { TerraDataRepo } from '../../libs/ajax/TerraDataRepo';
import isEqual from 'lodash/isEqual';
import TranslatedDulModal from '../modals/TranslatedDulModal';

const datasetTableHeader = [
  'DUOS ID',
  'Dataset Name',
  'Data Use',
  'Data Types',
  'Participants',
  'Access Type',
  'Data Location',
  'Export to Terra',
];

export const DatasetSearchTable = (props) => {
  const { datasets, history, icon, title } = props;
  const [filters, setFilters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState([]);
  const [exportableDatasets, setExportableDatasets] = useState({}); // datasetId -> snapshot
  const [tdrApiUrl, setTdrApiUrl] = useState('');
  const [showTranslatedDULModal, setShowTranslatedDULModal] = useState(false);
  const [dataUse, setDataUse] = useState();
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



  const selectHandler = async (event, data, selector) => {
    let idsToModify = [];
    if (selector === 'all') {
      data.rows.forEach((row) => {
        row.subtable.rows.forEach((subRow) => {
          idsToModify.push(subRow.id);
        });
      });
    } else if (selector === 'row') {
      const rowIds = data.subtable.rows.map(row => row.id);
      const isRowSelected = rowIds.every(id => selected.includes(id));
      isRowSelected ?
        await Metrics.captureEvent(eventList.dataLibrary, {'action': 'study-unselected'}) :
        await Metrics.captureEvent(eventList.dataLibrary, {'action': 'study-selected'});
      data.subtable.rows.forEach((row) => {
        idsToModify.push(row.id);
      });
    } else if (selector === 'subrow') {
      selected.includes(data.id) ?
        await Metrics.captureEvent(eventList.dataLibrary, {'action': 'dataset-unselected'}) :
        await Metrics.captureEvent(eventList.dataLibrary,{'action': 'dataset-selected'});
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
    // Note the dataset identifier is in each sub-table row.
    const datasetIdentifiers = data.subtable.rows.map((row) => row.datasetIdentifier);
    const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers);
    if (snapshots.filteredTotal > 0) {
      const datasetIdToSnapshot = _.chain(snapshots.items)
      // Ignore any snapshots that a user does not have export (steward or reader) to
        .filter((snapshot) => _.intersection(snapshots.roleMap[snapshot.id], ['steward', 'reader']).length > 0)
        .groupBy('duosId')
        .value();
      setExportableDatasets(datasetIdToSnapshot);
    }
  };

  const applyForAccess = async () => {
    const draftDatasets = selected.map((id) => parseInt(id.replace('dataset-', '')));
    const darDraft = await DAR.postDarDraft({ datasetId: draftDatasets });
    history.push(`/dar_application/${darDraft.referenceId}`);
  };

  const clearSearchRef = () => {
    searchRef.current.value = '';
    filterHandler(null, datasets, '', '');
  };

  const openTranslatedDUL = (dataUse) => {
    const mergedPrimaryAndSecondary = concat(dataUse.primary, dataUse.secondary);
    setDataUse(mergedPrimaryAndSecondary);
    setShowTranslatedDULModal(true);
  };

  useEffect(() => {
    if (isEmpty(filtered)) {
      return;
    }

  }, [filtered, exportableDatasets, tdrApiUrl]);

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
                return (
                  <DatasetSearchTableDisplay onSelect={selectHandler} filteredData={filtered} selected={selected}/>
                );
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
      {
        showTranslatedDULModal &&
        <TranslatedDulModal
          showModal={showTranslatedDULModal}
          dataUse={dataUse}
          onCloseRequest={()=>setShowTranslatedDULModal(false)}
        />
      }
    </>
  );
};

export default DatasetSearchTable;
