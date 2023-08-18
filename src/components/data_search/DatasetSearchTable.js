import { useEffect, useState } from 'react';
import { h, div, button } from 'react-hyperscript-helpers';
import datasetIcon from '../../images/icon_dataset_.png';
import { Styles } from '../../libs/theme';
import { groupBy } from 'lodash';
import CollapsibleTable from '../CollapsibleTable';
import TableHeaderSection from '../TableHeaderSection';
import { DAR } from '../../libs/ajax';
import {Storage} from '../../libs/storage';

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
  const [currentUser, setCurrentUser] = useState({});
  const [itemList, setItemList] = useState([]);
  const [checked, setChecked] = useState(false);
  const [selectedList, setSelectedList] = useState([]);

  const exportToRequest = async () => {
    let datasets = [];
    let datasetIdList = [];
    selectedList
      .forEach(dataset => {
        const dsNameProp = find({propertyName: 'Dataset Name'})(dataset.properties);
        const label = dsNameProp.propertyValue;
        datasets.push({
          key: dataset.dataSetId,
          value: dataset.dataSetId,
          label: label,
          concatenation: label,
        });
        datasetIdList.push(dataset.dataSetId);
      });
    const darBody = {
      userId: currentUser().userId,
      datasets: datasets,
      datasetId: datasetIdList
    };
    const formData = await DAR.postDarDraft(darBody);
    const referenceId = formData.referenceId;
    props.history.push({ pathname: '/dar_application/' + referenceId });
  };

  useEffect(() => {
    const selected = itemList.filter((item) => item.checked);
  
    setSelectedList(selected);
  }, [itemList]);

  // selecting entire page
  const selectAllOnPage = (e) => {
    const checked = isNil(e.target.checked) ? false : e.target.checked;

    const datasetIdsToCheck = data.map((row) => {
      return row.dataSetId;
    });

    const modifiedDatasetList = map((row) => {
      if (datasetIdsToCheck.includes(row.dataSetId)) {
        row.checked = checked;
      }

      return row;
    })(itemList);

    // Update state
    setItemList(modifiedDatasetList);
  };

  const allOnPageSelected = () => {

    return data.length > 0 && data.every((row) => {
      return row.checked;
    });
  };

  // select all datasets in a study


  // select one dataset
  const checkSingleRow = (dataset) => (e) => {
    const checked = isNil(e.target.checked) ? false : e.target.checked;
    const selectedDatasets = map(row => {
      if (row.dataSetId === dataset.dataSetId) {
        if (canApplyForDataset(row)) {
          row.checked = checked;
        }
      }
      return row;
    })(itemList);

    // Update state
    setDatasetList(selectedDatasets);
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setCurrentUser(Storage.getCurrentUser());
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
          subtable: {
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
        summary: 'faceted study search table',
        selectAllOnPage,
        allOnPageSelected,
        checkSingleRow
      }),
    ]),
    div({ className: 'f-right' }, [
      button({
        id: 'btn_applyAccess',
        isRendered: currentUser.isResearcher,
        disabled: (selectedList.length === 0),
        onClick: () => exportToRequest(),
        className: `btn-primary dataset-background search-wrapper`,
        'data-tip': 'Request Access for selected Studies', 'data-for': 'tip_requestAccess',
        style: { marginBottom: '30%'}
      }, ['Apply for Access'])
    ]),
  ]);
};

export default DatasetSearchTable;
