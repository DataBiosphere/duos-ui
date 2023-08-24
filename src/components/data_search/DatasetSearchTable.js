import { useEffect, useState } from 'react';
import { h, div, button } from 'react-hyperscript-helpers';
import datasetIcon from '../../logo.svg';
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
  const [selected, setSelected] = useState([]);

  const selectHandler = (event, data, selector) => {
    let idsToModify = [];
    if (selector === "all") {
      data.rows.forEach((row) => {
        row.subtable.rows.forEach((subRow) => {
          idsToModify.push(subRow.id);
        });
      });
    } else if (selector === "row") {
      data.subtable.rows.forEach((row) => {
        idsToModify.push(row.id);
      });
    } else if (selector === "subrow") {
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

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const studies = groupBy(datasets, 'study.studyId');
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
              value: entry[0].study.dataSubmitterEmail,
            },
            {
              value: entry[0].study.dataCustodianEmail.join(', '),
            },
          ],
          subtable: {
            headers: datasetTableHeader.map((header) => ({ value: header })),
            rows: entry.map((dataset) => {
              return {
                id: dataset.datasetIdentifier,
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
      title: 'Broad Data Library',
      description: 'Search, filter, and select datasets, then click \'Apply for Access\' to request access'
    }),
    div({ style: { paddingTop: '2rem' } }, [
      h(CollapsibleTable, {
        data: tableData,
        selected,
        selectHandler,
        isLoading,
        summary: 'faceted study search table'
      }),
    ]),
    div({ className: 'f-right' }, [
      button({
        id: 'btn_applyAccess',
        className: `btn-primary dataset-background search-wrapper`,
        'data-tip': 'Request Access for selected Studies', 'data-for': 'tip_requestAccess',
        style: { marginBottom: '30%' }
      }, ['Apply for Access'])
    ]),
  ]);
};

export default DatasetSearchTable;
