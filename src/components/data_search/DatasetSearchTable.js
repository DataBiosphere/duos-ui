import * as React from 'react';
import { Button, Link } from '@mui/material';
import { useEffect, useState, useCallback, useRef } from 'react';
import { groupBy, isEmpty } from 'lodash';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';
import { DAR } from '../../libs/ajax';
import DatasetFilterList from './DatasetFilterList';
import { Box } from '@mui/material';
import SearchBar from '../SearchBar';
import { getSearchFilterFunctions, searchOnFilteredList } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import {capitalize, cloneDeep, concat, each, every, filter, find, first, flatten, flow, forEach as lodashFPForEach, get, getOr, includes, isNil, join, map, toLower, uniq} from 'lodash/fp';


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
];

export const DatasetSearchTable = (props) => {
  const { datasets, history, icon, title } = props;
  const [filters, setFilters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tableData, setTableData] = useState({});
  const [selected, setSelected] = useState([]);
  const searchRef = useRef('');

  const isFiltered = (filter) => filters.indexOf(filter) > -1;

  const datasetFilter = (term, datasetTerm) => {
    const loweredTerm = toLower(term);
    console.log('loweredTerm: ', loweredTerm);
    // Approval status
    const status = !isNil(datasetTerm.dacApproval)
      ? datasetTerm.dacApproval
        ? 'accepted'
        : 'rejected'
      : 'pending';
    const primaryCodes = datasetTerm.dataUse?.primary.map(du => du.code);
    const secondaryCodes = datasetTerm.dataUse?.secondary.map(du => du.code);
    const codes = join(', ')(concat(primaryCodes)(secondaryCodes));
    const dataTypes = join(', ')(datasetTerm.study?.dataTypes);
    const custodians = join(', ')(datasetTerm.study?.dataCustodianEmail);
    // console.log('datasetTerm.datasetName: ', datasetTerm.datasetName);
    return includes(loweredTerm, toLower(datasetTerm.datasetName)) ||
      includes(loweredTerm, toLower(datasetTerm.datasetIdentifier)) ||
      includes(loweredTerm, toLower(datasetTerm.dac?.dacName)) ||
      includes(loweredTerm, toLower(datasetTerm.dac?.dacEmail)) ||
      includes(loweredTerm, toLower(datasetTerm.dataLocation)) ||
      includes(loweredTerm, toLower(codes)) ||
      includes(loweredTerm, toLower(datasetTerm.createUserDisplayName)) ||
      includes(loweredTerm, toLower(datasetTerm.url)) ||
      includes(loweredTerm, toLower(datasetTerm.study?.description)) ||
      includes(loweredTerm, toLower(datasetTerm.study?.dataSubmitterEmail)) ||
      includes(loweredTerm, toLower(dataTypes)) ||
      includes(loweredTerm, toLower(custodians)) ||
      includes(loweredTerm, toLower(datasetTerm.study?.phenotype)) ||
      includes(loweredTerm, toLower(datasetTerm.study?.piName)) ||
      includes(loweredTerm, toLower(datasetTerm.study?.species)) ||
      includes(loweredTerm, toLower(datasetTerm.study?.studyName)) ||
      includes(loweredTerm, toLower(status));
  };

  const filterHandler = (event, data, filter, searchTerm) => {
    var newFilters = [];
    if (!isFiltered(filter)) {
      newFilters = filters.concat(filter);
    } else {
      newFilters = filters.filter((f) => f !== filter);
    }
    setFilters(newFilters);

    var newFiltered = [];
    if (newFilters.length === 0) {
      newFiltered = data;
    } else {
      newFiltered = data.filter((dataset) => {
        if (newFilters.includes('search') && searchTerm !== '' && datasetFilter(searchTerm, dataset)) {
          // console.log("searchTerm", searchTerm);
          // console.log("dataset", dataset);
          // console.log("result", getSearchFilterFunctions().datasetTerms(searchTerm, dataset));
          // console.log("newFiltered", newFiltered);
          // if (getSearchFilterFunctions().datasetTerms(searchTerm, dataset)) {
          return true;
          // }
        } 
        return false;
      }).filter((dataset) => {
        // TODO: remove extra checks when openAccess property is deprecated
        if (newFilters.includes('open') && (dataset.openAccess || dataset.accessManagement === 'open')) {
          return true;
        }
        if (newFilters.includes('controlled') && (
          (!dataset.openAccess && dataset.accessManagement === undefined) || (dataset.openAccess === undefined && dataset.accessManagement === 'controlled')
        )) {
          return true;
        }
        if (newFilters.includes('external') && dataset.accessManagement === 'external') {
          return true;
        }
        // console.log("TEST :", getSearchFilterFunctions().datasetTerms(searchTerm, [dataset]))
        // add 'search' filter here; if the search box isn't empty & the filter is 'search' &  getSearchFilterFunctions().datasetTerms(searchTerm, newFiltered)ISH, return true 
        return false;
      });
    }

    // const searchFiltered = getSearchFilterFunctions().datasetTerms(searchTerm, newFiltered);
    // setFiltered(newFiltered.filter(value => searchFiltered.includes(value)));
    // console.log('searchTerm: ' + searchTerm);
    // console.log('filters: ', newFilters)
    // if (searchTerm) {
    //   const searchFiltered = getSearchFilterFunctions().datasetTerms(searchTerm, newFiltered) ;
    //   console.log("Filtered:", newFiltered.filter(value => searchFiltered.includes(value)))
    //   setFiltered(newFiltered.filter(value => searchFiltered.includes(value)));
    // } else {
    //   setFiltered(newFiltered);
    // }
    setFiltered(newFiltered);
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

  const applyForAccess = async () => {
    const draftDatasets = selected.map((id) => parseInt(id.replace('dataset-', '')));
    const darDraft = await DAR.postDarDraft({ datasetId: draftDatasets });
    history.push(`/dar_application/${darDraft.referenceId}`);
  };

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
                    value: dataset.url ? <Link href={dataset.url}>{dataset.dataLocation}</Link> : dataset.dataLocation,
                  },
                  {
                    value: dataset.dac?.dacName,
                  },
                ],
              };
            }),
          }
        };
      }),
    };

    setTableData(table);
  }, [filtered]);

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
            onChange={() => filterHandler(null, datasets, 'search', searchRef.current.value)}
            ref={searchRef}
          />
          <div/>
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
              <CollapsibleTable data={tableData} selected={selected} selectHandler={selectHandler} summary='faceted study search table' />
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
