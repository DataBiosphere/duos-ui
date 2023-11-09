import * as React from 'react';
import { Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { groupBy, isEmpty } from 'lodash';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';
import { DAR } from '../../libs/ajax';
import DatasetFilterList from './DatasetFilterList';
import { Box } from '@mui/material';

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

  const isFiltered = (filter) => filters.indexOf(filter) > -1;

  const filterHandler = (event, data, filter) => {
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
        if (newFilters.includes('open') && dataset.openAccess) {
          return true;
        }
        if (newFilters.includes('controlled') && !dataset.openAccess) {
          return true;
        }
        return false;
      });
    }
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
            },
            {
              value: entry[0].study.description,
            },
            {
              value: entry.length,
            },
            {
              value: isNaN(sum) ? undefined : sum,
            },
            {
              value: entry[0].study.phenotype,
            },
            {
              value: entry[0].study.species,
            },
            {
              value: entry[0].study.piName,
            },
            {
              value: entry[0].study.dataCustodianEmail.join(', '),
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
                    value: dataset.dataLocation,
                  },
                  {
                    value: dataset.dacName,
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
      <Box sx={{ display: 'flex', flexDirection: 'row', paddingTop: '2em' }}>
        <Box sx={{ width: '14%', padding: '0 1em' }}>
          <DatasetFilterList datasets={datasets} filters={filters} filterHandler={filterHandler} />
        </Box>
        <Box sx={{ width: '85%', padding: '0 1em' }}>
          {
            isEmpty(datasets) ?
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
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
