import {contains, find, getOr, isEmpty, isNil, map} from 'lodash/fp';
import {Fragment, useEffect, useState} from 'react';
import {a, button, div, form, h, input, label, span, table, tbody, td, th, thead, tr} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import {ConfirmationDialog} from '../components/ConfirmationDialog';
import {ConnectDatasetModal} from '../components/modals/ConnectDatasetModal';
import TranslatedDulModal from '../components/modals/TranslatedDulModal';
import {PageHeading} from '../components/PageHeading';
import {PaginatorBar} from '../components/PaginatorBar';
import {SearchBox} from '../components/SearchBox';
import {DAC, DAR, DataSet, Files} from '../libs/ajax';
import {Storage} from '../libs/storage';
import {Theme} from '../libs/theme';
import datasetIcon from '../images/icon_dataset_.png';
import {getBooleanFromEventHtmlDataValue} from '../libs/utils';

const tableBody = {
  ...Theme.textTableBody,
  padding: '8px 5px 8px 5px'
};

export default function DatasetCatalog(props) {

  // Data states
  const [currentUser, setCurrentUser] = useState({});
  const [datasetList, setDatasetList] = useState([]);
  const [dacs, setDacs] = useState([]);

  // Selection States
  const [allChecked, setAllChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataUse, setDataUse] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [errorTitle, setErrorTitle] = useState();
  const [pageSize, setPageSize] = useState(10);
  const [searchDulText, setSearchDulText] = useState();
  const [selectedDataset, setSelectedDataset] = useState();
  const [selectedDatasetId, setSelectedDatasetId] = useState();

  // Modal States
  const [showConnectDataset, setShowConnectDataset] = useState(false);
  const [showDatasetDisable, setShowDatasetDisable] = useState(false);
  const [showDatasetDelete, setShowDatasetDelete] = useState(false);
  const [showDatasetEnable, setShowDatasetEnable] = useState(false);
  const [showDatasetEdit, setShowDatasetEdit] = useState(false);
  const [showTranslatedDULModal, setShowTranslatedDULModal] = useState(false);

  // Initialize page data
  useEffect( () => {
    const init = async() => {
      setCurrentUser(Storage.getCurrentUser());
      await getDatasets();
      await getDacs();
      ReactTooltip.rebuild();
    };
    init();
  }, []);

  const getDatasets = async () => {
    let datasets = await DataSet.getDatasets();
    datasets = map((row, index) => {
      row.checked = false;
      row.ix = index;
      row.dbGapLink =
        getOr('')('propertyValue')(find({propertyName: 'dbGAP'})(row.properties));
      return row;
    })(datasets);
    setDatasetList(datasets);
  };

  const getDacs = async () => {
    let dacs = await DAC.list(false);
    dacs = dacs.map(dac => {
      return {id: dac.dacId, name: dac.name};
    });
    setDacs(dacs);
  };

  const downloadList = (dataset) => {
    Files.getApprovedUsersFile(dataset.dataSetId + '-ApprovedRequestors.tsv', dataset.dataSetId);
  };

  const exportToRequest = async () => {
    let datasets = [];
    let datasetIdList = [];
    datasetList.filter(row => row.checked)
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
      userId: Storage.getCurrentUser().dacUserId,
      datasets: datasets,
      datasetId: datasetIdList
    };
    const formData = await DAR.postDarDraft(darBody);
    const referenceId = formData.referenceId;
    props.history.push({ pathname: 'dar_application/' + referenceId });
  };

  const openConnectDataset = (dataset) => {
    setShowConnectDataset(true);
    setSelectedDataset(dataset);
  };

  const openTranslatedDUL = (dataUse) => {
    setDataUse(dataUse);
    setShowTranslatedDULModal(true);
  };

  const openDelete = (datasetId) => () => {
    setShowDatasetDelete(true);
    setSelectedDatasetId(datasetId);
  };

  const openEdit = (datasetId) => () => {
    setShowDatasetEdit(true);
    setSelectedDatasetId(datasetId);
  };

  const openEnable = (datasetId) => () => {
    setShowDatasetEnable(true);
    setSelectedDatasetId(datasetId);
  };

  const openDisable = (datasetId) => () => {
    setShowDatasetDisable(true);
    setSelectedDatasetId(datasetId);
  };

  const dialogHandlerDelete = async (e) => {
    const answer = getBooleanFromEventHtmlDataValue(e);
    if (answer) {
      DataSet.deleteDataset(selectedDatasetId).then(() => {
        getDatasets();
        setShowDatasetDelete(false);
      }).catch(() => {
        setShowDatasetDelete(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDatasetDelete(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const dialogHandlerEnable = async(e) => {
    const answer = getBooleanFromEventHtmlDataValue(e);
    if (answer) {
      DataSet.disableDataset(selectedDatasetId, true).then(() => {
        getDatasets();
        setShowDatasetEnable(false);
      }).catch(() => {
        setShowDatasetEnable(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDatasetEnable(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const dialogHandlerDisable = async (e) => {
    const answer = getBooleanFromEventHtmlDataValue(e);
    if (answer) {
      DataSet.disableDataset(selectedDatasetId, false).then(() => {
        getDatasets();
        setShowDatasetDisable(false);
      }).catch(() => {
        setShowDatasetDisable(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDatasetDisable(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const dialogHandlerEdit = async (e) => {
    const answer = getBooleanFromEventHtmlDataValue(e);
    if (answer) {
      setShowDatasetEdit(false);
      props.history.push({ pathname: `dataset_registration/${selectedDatasetId}` });
    } else {
      setShowDatasetEdit(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const download = () => {
    const listDownload = datasetList.filter(row => row.checked);
    let dataSetsId = [];
    listDownload.forEach(dataset => {
      dataSetsId.push(dataset.dataSetId);
    });
    DataSet.downloadDataSets(dataSetsId, 'datasets.tsv');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchDul = (query) => {
    setSearchDulText(query);
  };

  const searchTable = (query) => (row) => {
    if (query) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  const selectAll = (e) => {
    const checked = isNil(e.target.checked) ? false : e.target.checked;
    const selectedDatasets = map(row => {
      if (checked) {
        // The select all case, only select active datasets
        if (row.active) {
          row.checked = checked;
        }
      } else {
        // The unselect all case, ensure everything is unselected
        row.checked = checked;
      }
      return row;
    })(datasetList);

    // Update state
    setAllChecked(checked);
    setDatasetList(selectedDatasets);
  };

  const checkSingleRow = (dataset) => (e) => {
    const checked = isNil(e.target.checked) ? false : e.target.checked;
    const selectedDatasets = map(row => {
      if (row.dataSetId === dataset.dataSetId) {
        if (row.active) {
          row.checked = checked;
        }
      }
      return row;
    })(datasetList);

    // Update state
    setDatasetList(selectedDatasets);
  };

  const inactiveCheckboxStyle = (dataset) => {
    if (!dataset.active) {
      return {cursor: 'default', opacity: '50%'};
    }
    return {};
  };

  const findPropertyValue = (dataSet, propName, defaultVal) => {
    const defaultValue = isNil(defaultVal) ? '' : defaultVal;
    return span({}, [
      getOr(defaultValue)('propertyValue')(find({ propertyName: propName })(dataSet.properties))
    ]);
  };

  const findDacName = (dacs, dataSet) => {
    return span({}, [
      getOr('')('name')(find({ id: dataSet.dacId })(dacs))
    ]);
  };

  const getLinkDisplay = (dataSet, trIndex) => {
    try {
      const url = new URL(dataSet.dbGapLink);
      return a({
        id: trIndex + '_linkdbGap',
        name: 'link_dbGap',
        href: url,
        target: '_blank',
        className: 'enabled'
      }, ['Link']);
    } catch (e) {
      return span({}, ["--"]);
    }
  };

  return (
    h(Fragment, {}, [
      div({ className: 'container container-wide' }, [

        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'datasetCatalog',
              imgSrc: datasetIcon,
              iconSize: 'large',
              color: 'dataset',
              title: 'Dataset Catalog',
              description: "Search and select datasets then click 'Apply for Access' to request access"
            }),
          ]),
          div({ className: 'right', isRendered: (currentUser.isAdmin || currentUser.isChairPerson) }, [
            div({ className: 'col-lg-7 col-md-7 col-sm-7 col-xs-7 search-wrapper' }, [
              h(SearchBox, { id: 'datasetCatalog', searchHandler: handleSearchDul, pageHandler: handlePageChange, color: 'dataset' })
            ]),
            button({
              id: 'btn_addDataset',
              isRendered: currentUser.isAdmin,
              onClick: () => props.history.push({ pathname: 'dataset_registration' }),
              className: 'f-right btn-primary dataset-background search-wrapper',
              'data-tip': 'Add a new Dataset', 'data-for': 'tip_addDataset'
            }, ['Add Dataset',
              span({ className: 'glyphicon glyphicon-plus-sign', style: { 'marginLeft': '5px' }, 'aria-hidden': 'true' })
            ])
          ]),
        ]),

        div({style: Theme.lightTable}, [
          form({ className: 'pos-relative' }, [
            div({ className: 'checkbox check-all' }, [
              input({ checked: allChecked, type: 'checkbox', 'select-all': 'true', className: 'checkbox-inline', id: 'chk_selectAll', onChange: selectAll }),
              label({ className: 'regular-checkbox', htmlFor: 'chk_selectAll' }, []),
            ]),
          ]),

          div({ className: currentUser.isAdmin && !currentUser.isResearcher ? 'table-scroll-admin' : 'table-scroll' }, [
            table({ className: 'table' }, [
              thead({}, [
                tr({}, [
                  th(),
                  th({ isRendered: currentUser.isAdmin, className: 'cell-size', style: { minWidth: '14rem' }}, ['Actions']),
                  th({ className: 'cell-size' }, ['Dataset ID']),
                  th({ className: 'cell-size' }, ['Dataset Name']),
                  th({ className: 'cell-size' }, ['Data Access Committee']),
                  th({ className: 'cell-size' }, ['Data Source']),
                  th({ className: 'cell-size' }, ['Structured Data Use Limitations']),
                  th({ className: 'cell-size' }, ['Data Type']),
                  th({ className: 'cell-size' }, ['Disease Studied']),
                  th({ className: 'cell-size' }, ['Principal Investigator (PI)']),
                  th({ className: 'cell-size' }, ['# of Participants']),
                  th({ className: 'cell-size' }, ['Description']),
                  th({ className: 'cell-size' }, ['Species']),
                  th({ className: 'cell-size' }, ['Data Custodian']),
                  th({ className: 'cell-size' }, ['Consent ID']),
                  th({ className: 'cell-size' }, ['SC-ID']),
                  th({ className: 'cell-size' }, ['Approved Requestors'])
                ])
              ]),

              tbody({ isRendered: !isNil(datasetList) && !isEmpty(datasetList) }, [
                datasetList.filter(searchTable(searchDulText))
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((dataset, trIndex) => {
                    // console.log(JSON.stringify(dataset.active));
                    // console.log(JSON.stringify(dataset.dataSetId));
                    return h(Fragment, { key: trIndex }, [

                      tr({ className: 'tableRow' }, [
                        td({}, [
                          div({ className: 'checkbox' }, [
                            input({
                              type: 'checkbox',
                              id: trIndex + '_chkSelect',
                              name: 'chk_select',
                              checked: dataset.checked,
                              className: 'checkbox-inline user-checkbox',
                              onChange: checkSingleRow(dataset)
                            }),
                            label({
                              className: 'regular-checkbox rp-choice-questions',
                              // Apply additional styling for inactive datasets
                              style: inactiveCheckboxStyle(dataset),
                              htmlFor: trIndex + '_chkSelect' })
                          ])
                        ]),

                        td({ isRendered: currentUser.isAdmin, style: { minWidth: '14rem' } }, [
                          div({ className: 'dataset-actions' }, [
                            a({
                              id: trIndex + '_btnDelete', name: 'btn_delete', onClick: openDelete(dataset.dataSetId),
                              disabled: !dataset.deletable
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-trash caret-margin ' + (dataset.deletable ? 'default-color' : ''),
                                'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnEdit', name: 'btn_edit', onClick: openEdit(dataset.dataSetId),
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-pencil caret-margin dataset-color', 'aria-hidden': 'true',
                                'data-tip': 'Edit dataset', 'data-for': 'tip_edit'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnDisable', name: 'btn_disable', isRendered: dataset.active,
                              onClick: openDisable(dataset.dataSetId)
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color', 'aria-hidden': 'true',
                                'data-tip': 'Disable dataset', 'data-for': 'tip_disable'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnEnable', name: 'btn_enable', isRendered: !dataset.active,
                              onClick: openEnable(dataset.dataSetId)
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color', 'aria-hidden': 'true',
                                'data-tip': 'Enable dataset', 'data-for': 'tip_enable'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnConnect', name: 'btn_connect', onClick: () => openConnectDataset(dataset)
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-link caret-margin ' +
                                  (dataset.isAssociatedToDataOwners ? 'dataset-color' : 'default-color'), 'aria-hidden': 'true',
                                'data-tip': 'Connect with Data Owner', 'data-for': 'tip_connect'
                              })
                            ])
                          ])
                        ]),

                        td({
                          id: dataset.alias + '_dataset', name: 'alias',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [dataset.alias]),

                        td({
                          id: trIndex + '_datasetName', name: 'datasetName',
                          className: 'cell-size ' + (!dataset.active ? !!'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          a({
                            href: `/dataset_statistics/${dataset.dataSetId}`,
                            className: 'enabled'
                          }, [
                            findPropertyValue(dataset, 'Dataset Name')
                          ])
                        ]),

                        td({
                          id: trIndex + '_dac', name: 'dac',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findDacName(dacs, dataset)
                        ]),

                        td({
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          getLinkDisplay(dataset, trIndex)
                        ]),

                        td({
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          a({
                            id: trIndex + '_linkTranslatedDul', name: 'link_translatedDul',
                            onClick: () => openTranslatedDUL(dataset.dataUse),
                            className: (!dataset.active ? 'dataset-disabled' : 'enabled')
                          }, ['Translated Use Restriction'])
                        ]),

                        td({
                          id: trIndex + '_dataType', name: 'dataType',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Data Type')
                        ]),

                        td({
                          id: trIndex + '_phenotype', name: 'phenotype',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Phenotype/Indication')
                        ]),

                        td({
                          id: trIndex + '_pi', name: 'pi', className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Principal Investigator(PI)')
                        ]),

                        td({
                          id: trIndex + '_participants', name: 'participants',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, '# of participants')
                        ]),

                        td({
                          id: trIndex + '_description', name: 'description',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Description')
                        ]),

                        td({
                          id: trIndex + '_species', name: 'species',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Species')
                        ]),

                        td({
                          id: trIndex + '_depositor', name: 'depositor',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Data Depositor')
                        ]),

                        td({
                          id: trIndex + '_consentId', name: 'consentId',
                          className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [dataset.consentId]),

                        td({
                          id: trIndex + '_scid', name: 'sc-id', className: 'cell-size ' + (!dataset.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataset, 'Sample Collection ID', '---')
                        ]),

                        td({ className: 'cell-size', style: tableBody }, [
                          a({
                            id: trIndex + '_linkDownloadList', name: 'link_downloadList', onClick: () => downloadList(dataset),
                            className: 'enabled'
                          }, ['Download List'])
                        ])
                      ])
                    ]);
                  })
              ])
            ])
          ]),
          div({ style: { 'margin': '0 20px 15px 20px' } }, [
            PaginatorBar({
              total: datasetList.filter(searchTable(searchDulText)).length,
              pageSize: pageSize,
              currentPage: currentPage,
              onPageChange: handlePageChange,
              changeHandler: handleSizeChange,
            })
          ])
        ]),

        div({ className: 'col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding' }, [
          button({
            id: 'btn_downloadSelection',
            download: '',
            disabled: datasetList.filter(row => row.checked).length === 0,
            onClick: download,
            className: 'col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary dataset-background'
          }, [
            'Download Dataset List',
            span({ className: 'glyphicon glyphicon-download', style: { 'marginLeft': '5px' }, 'aria-hidden': 'true' })
          ]),
        ]),
        div({ className: 'f-right' }, [
          button({
            id: 'btn_applyAccess',
            isRendered: currentUser.isResearcher,
            disabled: (datasetList.filter(row => row.checked).length === 0),
            onClick: () => exportToRequest(),
            className: 'btn-primary dataset-background search-wrapper',
            'data-tip': 'Request Access for selected Datasets', 'data-for': 'tip_requestAccess'
          }, ['Apply for Access'])
        ]),
        h(TranslatedDulModal,{
          isRendered: showTranslatedDULModal,
          showModal: showTranslatedDULModal,
          dataUse: dataUse,
          onOKRequest: () => setShowTranslatedDULModal(false),
          onCloseRequest: () => setShowTranslatedDULModal(false)
        }),

        ConfirmationDialog({
          title: 'Delete Dataset Confirmation?',
          color: 'cancel',
          showModal: showDatasetDelete,
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          action: { label: 'Yes', handler: () => dialogHandlerDelete }
        }, [div({ className: 'dialog-description' }, ['Are you sure you want to delete this Dataset?']),]),

        ConfirmationDialog({
          title: 'Disable Dataset Confirmation?',
          color: 'dataset',
          showModal: showDatasetDisable,
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          action: { label: 'Yes', handler: () => dialogHandlerDisable }
        }, [div({ className: 'dialog-description' }, ["If you disable a Dataset, Researchers won't be able to request access on it from now on. New Access elections related to this dataset won't be available but opened ones will continue."]),]),

        ConfirmationDialog({
          title: 'Enable Dataset Confirmation?',
          color: 'dataset',
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          showModal: showDatasetEnable,
          action: { label: 'Yes', handler: () => dialogHandlerEnable }
        }, [div({ className: 'dialog-description' }, ['If you enable a Dataset, Researchers will be able to request access on it from now on.']),]),

        ConfirmationDialog({
          title: 'Edit Dataset Confirmation?',
          color: 'dataset',
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          showModal: showDatasetEdit,
          action: { label: 'Yes', handler: () => dialogHandlerEdit }
        }, [div({ className: 'dialog-description' }, ['Are you sure you want to edit this Dataset?'])]),

        ConnectDatasetModal({
          isRendered: showConnectDataset,
          showModal: showConnectDataset,
          onOKRequest: () => setShowConnectDataset(false),
          onCloseRequest: () => setShowConnectDataset(false),
          dataset: selectedDataset,
        }),
        h(ReactTooltip, {
          id: 'tip_delete',
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: 'tip_disable',
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: 'tip_enable',
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: 'tip_connect',
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: 'tip_requestAccess',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        })
      ])
    ])
  );
}
