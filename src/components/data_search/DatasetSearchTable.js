import * as React from 'react';
import _ from 'lodash';
import { Box, Button, Link } from '@mui/material';
import { useEffect, useState } from 'react';
import { groupBy, isEmpty } from 'lodash';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';
import DatasetExportButton from './DatasetExportButton';
import { DAR, TerraDataRepo } from '../../libs/ajax';
import { Config } from '../../libs/config';
import DatasetFilterList from './DatasetFilterList';
import { Notifications } from '../../libs/utils';

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
                datasetIdentifier: dataset.datasetIdentifier,
                data: [
                  {
                    value: <Link key={`dataset.datasetId`} href={`/dataset_statistics/${dataset.datasetId}`}>{dataset.datasetIdentifier}</Link>,
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
