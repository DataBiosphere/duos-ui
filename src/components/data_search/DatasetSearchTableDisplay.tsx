import CollapsibleTable from '../CollapsibleTable';
import * as React from 'react';
import {Box} from '@mui/material';
import {groupBy, isEmpty} from 'lodash';
import {DatasetTerm} from 'src/types/model';

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

interface DatasetSearchTableDisplayProps{
  onSelect: (event: any, data: any, selector: any) => void;
  filteredData: DatasetTerm[];
  selected: DatasetTerm[];
}

export const DatasetSearchTableDisplay = (props: DatasetSearchTableDisplayProps) => {
  const { onSelect, filteredData, selected } = props;

  const studies = groupBy(filteredData, 'study.studyId');

  const tableData = {
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
      };
    }),
  };


  return isEmpty(filteredData) ? (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <h1>There are no datasets that fit these criteria.</h1>
    </Box>
  )
    : (
      <CollapsibleTable
        data={tableData}
        selected={selected}
        selectHandler={onSelect}
        summary='faceted study search table'
      />
    );
};
