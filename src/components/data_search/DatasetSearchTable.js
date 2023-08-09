import { useEffect, useState } from 'react';
import { h, div } from 'react-hyperscript-helpers';
import datasetIcon from '../../images/icon_dataset_.png';
import { Styles } from '../../libs/theme';
import { groupBy } from 'lodash';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';

const studyTableHeader = [
  'Study Name',
  'Description',
  'Datasets',
  'Participants',
  'Phenotype',
  'Species',
  'PI Name',
  'Data Submitter',
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
  const { datasets, isLoading } = props;
  const [tableData, setTableData] = useState({});

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const studies = groupBy(datasets, 'study.studyId');
    const table = {
      headers: studyTableHeader.map((header) => ({ value: header })),
      rows: Object.values(studies).map((entry) => {
        const sum = entry.reduce((acc, dataset) => {
          return acc + dataset.participantCount;
        }, 0);
        return {
          id: entry[0].study.studyId,
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
              value: entry[0].study.dataSubmitterId,
            },
            {
              value: entry[0].study.dataCustodian,
            },
          ],
          table: {
            headers: datasetTableHeader.map((header) => ({ value: header })),
            rows: entry.map((dataset) => {
              return {
                id: dataset.datasetId,
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
                    value: dataset.dacId,
                  },
                ],
              };
            }),
          }
        };
      }),
    };

    setTableData(table);
  }, [datasets, isLoading]);

  return div({ style: Styles.PAGE }, [
    h(TableHeaderSection, {
      icon: datasetIcon,
      title: 'Data Catalog',
      description: 'Search, filter, and select datasets, then click \'Apply for Access\' to request access'
    }),
    div({ style: { paddingTop: '2rem' } }, [
      h(CollapsibleTable, {
        data: tableData,
        isLoading,
        summary: 'faceted study search table'
      }),
    ]),
  ]);
};

export default DatasetSearchTable;
