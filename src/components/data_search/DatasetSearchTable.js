import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { Button, Link } from '@mui/material';
import { groupBy, isEmpty } from 'lodash';
import TableHeaderSection from '../TableHeaderSection';
import { Box } from '@mui/material';
import DatasetTableMaterial from './DatasetTableMaterial';

const studyTableHeader = () => [
  {
    accessorKey: 'name',
    header: 'Study Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'numDatasets',
    header: 'Datasets',
  },
  {
    accessorKey: 'participants',
    header: 'Participants',
  },
  {
    accessorKey: 'phenotype',
    header: 'Phenotype',
  },
  {
    accessorKey: 'species',
    header: 'Species',
  },
  {
    accessorKey: 'piName',
    header: 'PI Name',
  },
  {
    accessorKey: 'dataCustodian',
    header: 'Data Custodian',
  },
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
  const [tableData, setTableData] = useState([]);
  const columns = useMemo(studyTableHeader, []);

  useEffect(() => {
    const studies = groupBy(datasets, 'study.studyId');
    const table = Object.values(studies).map((entry) => {
      const participantCount = entry.reduce((acc, dataset) => {
        return acc + dataset.participantCount;
      }, 0);
      return {
        name: entry[0].study.studyName,
        description: entry[0].study.description,
        numDatasets: entry.length,
        datasets: entry.map((dataset) => {
          return {
            id: 'dataset-' + dataset.datasetId,
            duosId: dataset.datasetIdentifier,
            dataUse: dataset.dataUse?.primary.map((use) => use.code).join(', '),
            dataTypes: dataset.dataTypes,
            participants: dataset.participantCount,
            dataLocation: dataset.url ? <Link href={dataset.url}>{dataset.dataLocation}</Link> : dataset.dataLocation,
            dacName: dataset.dac?.dacEmail ? <Link href={'mailto:' + dataset.dac.dacEmail}>{dataset.dac?.dacName}</Link> : dataset.dac?.dacName,
          }
        }),
        participants: isNaN(participantCount) ? undefined : participantCount,
        phenotype: entry[0].study.phenotype,
        species: entry[0].study.species,
        piName: entry[0].study.piName,
        dataCustodian: entry[0].study.dataCustodianEmail?.join(', ')
      };
    });
    console.log(table);
    setTableData(table);
  }, [datasets]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <TableHeaderSection icon={icon} title={title} description="Search, filter, and select datasets, then click 'Apply for Access' to request access" />
      <Box sx={{ display: 'flex', flexDirection: 'row', paddingTop: '2em' }}>
        <Box sx={{ width: '85%', padding: '0 1em' }}>
          {
            isEmpty(datasets) ?
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <h1>No datasets registered for this library.</h1>
              </Box>
              :
              <DatasetTableMaterial columns={columns} data={tableData} />
          }
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', padding: '2em 4em' }}>
        {
          !isEmpty(datasets) &&
          <Button variant="contained" onClick={() => { }} sx={{ transform: 'scale(1.5)' }} >
            Apply for Access
          </Button>
        }
      </Box>
    </Box>
  );
};

export default DatasetSearchTable;
