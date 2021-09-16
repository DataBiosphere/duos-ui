import find from 'lodash/find';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import some from 'lodash/some';
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

const tableBody = {
  ...Theme.textTableBody,
  padding: '8px 5px 8px 5px'
};

export default function DatasetCatalog(props) {

  const [datasetList, setDatasetList] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataUse, setDataUse] = useState();
  const [dacs, setDacs] = useState([]);
  const [disableOkButton, setDisableOkButton] = useState(false);
  const [disableApplyAccessButton, setDisableApplyAccessButton] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isResearcher, setIsResearcher] = useState(null);
  const [isChairPerson, setIsChairPerson] = useState(null);
  const [searchDulText, setSearchDulText] = useState();

  const [allChecked, setAllChecked] = useState(false);
  const [showConnectDatasetModal, setShowConnectDatasetModal] = useState(false);
  const [showTranslatedDULModal, setShowTranslatedDULModal] = useState();
  const [showDialogDisable, setShowDialogDisable] = useState(false);
  const [showDialogDelete, setShowDialogDelete] = useState(false);
  const [showDialogEnable, setShowDialogEnable] = useState(false);
  const [showDialogEdit, setShowDialogEdit] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const [errorTitle, setErrorTitle] = useState();
  const [selectedDataset, setSelectedDataset] = useState();
  const [selectedDatasetId, setSelectedDatasetId] = useState();

  // Initialize page data
  useEffect( () => {
    const init = async() => {
      const currentUser = Storage.getCurrentUser();
      setIsAdmin(currentUser.isAdmin);
      setIsResearcher(currentUser.isResearcher);
      setIsChairPerson(currentUser.isChairPerson);
      const catalogPromises = await Promise.all([
        getDatasets(),
        getDacs()
      ]);
      const datasets = catalogPromises[0];
      const dacs = catalogPromises[1];
      setDatasetList(datasets);
      setDacs(dacs);
    };
    init();
  }, []);

  const getDatasets = async () => {
    let datasets = await DataSet.getDatasets();
    datasets.forEach((row, index) => {
      row.checked = false;
      row.ix = index;
      row.dbGapLink =
        get (
          find(
            row.properties,
            p => {
              return p.propertyName === 'dbGAP';
            },
          ), 'propertyValue', '') ;
    });
    return datasets;
  };

  const getDacs = async () => {
    let dacs = await DAC.list(false);
    return dacs.map(dac => {
      return {id: dac.dacId, name: dac.name};
    });
  };

  const downloadList = (dataset) => {
    Files.getApprovedUsersFile(dataset.dataSetId + '-ApprovedRequestors.tsv', dataset.dataSetId);
  };

  const exportToRequest = async () => {
    let datasets = [];
    let datasetIdList = [];
    datasetList.filter(row => row.checked)
      .forEach(dataset => {
        const dsNameProp = find(dataset.properties, {propertyName: 'Dataset Name'});
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
    setShowConnectDatasetModal(true);
    setSelectedDataset(dataset);
  };

  const closeConnectDatasetModal = () => {
    setShowConnectDatasetModal(false);
  };

  const okConnectDatasetModal = async () => {
    setShowConnectDatasetModal(false);
    const datasets = await getDatasets();
    setDatasetList(datasets);
  };

  const openTranslatedDUL = (dataUse) => {
    setDataUse(dataUse);
    setShowTranslatedDULModal(true);
  };

  const closeTranslatedDULModal = () => {
    setShowTranslatedDULModal(false);
  };

  const okTranslatedDULModal = () => {
    setShowTranslatedDULModal(false);
  };

  const openDelete = (datasetId) => () => {
    setShowDialogDelete(true);
    setSelectedDatasetId(datasetId);
  };

  const openEdit = (datasetId) => () => {
    setShowDialogEdit(true);
    setSelectedDatasetId(datasetId);
  };

  const openEnable = (datasetId) => () => {
    setShowDialogEnable(true);
    setSelectedDatasetId(datasetId);
  };

  const openDisable = (datasetId) => () => {
    setShowDialogDisable(true);
    setSelectedDatasetId(datasetId);
  };

  const dialogHandlerDelete = (answer) => () => {
    setDisableOkButton(true);
    if (answer) {
      DataSet.deleteDataset(selectedDatasetId).then(() => {
        getDatasets();
        setDisableOkButton(false);
        setShowDialogDelete(false);
      }).catch(() => {
        setShowDialogDelete(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDialogDelete(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
      setDisableOkButton(false);
    }
  };

  const dialogHandlerEnable = (answer) => () => {
    setDisableOkButton(true);
    if (answer) {
      DataSet.disableDataset(selectedDatasetId, true).then(() => {
        getDatasets();
        setDisableOkButton(false);
        setShowDialogEnable(false);
      }).catch(() => {
        setShowDialogEnable(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDialogEnable(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
      setDisableOkButton(false);
    }

  };

  const dialogHandlerDisable = (answer) => () => {
    setDisableOkButton(true);
    if (answer) {
      DataSet.disableDataset(selectedDatasetId, false).then(() => {
        getDatasets();
        setDisableOkButton(false);
        setShowDialogDisable(false);
      }).catch(() => {
        setShowDialogDisable(true);
        setErrorMessage('Please try again later.');
        setErrorTitle('Something went wrong');
      });
    } else {
      setShowDialogDisable(false);
      setErrorMessage(undefined);
      setErrorTitle(undefined);
    }
  };

  const dialogHandlerEdit = (answer) => () => {
    setDisableOkButton(true);
    if (answer) {
      setDisableOkButton(false);
      setShowDialogEdit(false);
      props.history.push({ pathname: `dataset_registration/${selectedDatasetId}` });
    } else {
      setShowDialogEdit(false);
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
    const checked = e.target.checked;
    const catalog = datasetList;
    const checkedCatalog = catalog.map(row => { row.checked = checked; return row; });
    const disabledChecked = some(catalog, {'checked': true, 'active': false});
    setAllChecked(checked);
    setDisableApplyAccessButton(disabledChecked);
    setDatasetList(checkedCatalog);
  };

  const checkSingleRow = (index) => (e) => {
    let catalog = datasetList;
    const catalogElement = catalog[index];
    catalogElement.checked = e.target.checked;

    catalog = [
      ...catalog.slice(0, index),
      ...[catalogElement],
      ...catalog.slice(index + 1)
    ];

    const disabledChecked = some(catalog, {'checked': true, 'active': false});

    setDisableApplyAccessButton(disabledChecked);
    setDatasetList(catalog);
  };

  const findPropertyValue = (dataSet, propName, defaultVal) => {
    const defaultValue = isNil(defaultVal) ? '' : defaultVal;
    return span({}, [get(find(dataSet.properties, p => { return p.propertyName === propName; }), 'propertyValue', defaultValue)]);
  };

  const findDacName = (dacs, dataSet) => {
    return span({}, [get(find(dacs, dac => { return dac.id === dataSet.dacId; }), 'name', '')]);
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
          div({ className: 'right', isRendered: (isAdmin || isChairPerson) }, [
            div({ className: 'col-lg-7 col-md-7 col-sm-7 col-xs-7 search-wrapper' }, [
              h(SearchBox, { id: 'datasetCatalog', searchHandler: handleSearchDul, pageHandler: handlePageChange, color: 'dataset' })
            ]),
            button({
              id: 'btn_addDataset',
              isRendered: isAdmin,
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

          div({ className: isAdmin && !isResearcher ? 'table-scroll-admin' : 'table-scroll' }, [
            table({ className: 'table' }, [
              thead({}, [
                tr({}, [
                  th(),
                  th({ isRendered: isAdmin, className: 'cell-size', style: { minWidth: '14rem' }}, ['Actions']),
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
                  .map((dataSet, trIndex) => {
                    return h(Fragment, { key: trIndex }, [

                      tr({ className: 'tableRow' }, [

                        td({}, [
                          div({ className: 'checkbox' }, [
                            input({
                              type: 'checkbox',
                              id: trIndex + '_chkSelect',
                              name: 'chk_select',
                              checked: dataSet.checked, className: 'checkbox-inline user-checkbox', 'add-object-id': 'true',
                              onChange: checkSingleRow(dataSet.ix)
                            }),
                            label({ className: 'regular-checkbox rp-choice-questions', htmlFor: trIndex + '_chkSelect' })
                          ])
                        ]),

                        td({ isRendered: isAdmin, style: { minWidth: '14rem' } }, [
                          div({ className: 'dataset-actions' }, [
                            a({
                              id: trIndex + '_btnDelete', name: 'btn_delete', onClick: openDelete(dataSet.dataSetId),
                              disabled: !dataSet.deletable
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-trash caret-margin ' + (dataSet.deletable ? 'default-color' : ''),
                                'aria-hidden': 'true', 'data-tip': 'Delete dataset', 'data-for': 'tip_delete'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnEdit', name: 'btn_edit', onClick: openEdit(dataSet.dataSetId),
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-pencil caret-margin dataset-color', 'aria-hidden': 'true',
                                'data-tip': 'Edit dataset', 'data-for': 'tip_edit'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnDisable', name: 'btn_disable', isRendered: dataSet.active,
                              onClick: openDisable(dataSet.dataSetId)
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color', 'aria-hidden': 'true',
                                'data-tip': 'Disable dataset', 'data-for': 'tip_disable'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnEnable', name: 'btn_enable', isRendered: !dataSet.active,
                              onClick: openEnable(dataSet.dataSetId)
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color', 'aria-hidden': 'true',
                                'data-tip': 'Enable dataset', 'data-for': 'tip_enable'
                              })
                            ]),

                            a({
                              id: trIndex + '_btnConnect', name: 'btn_connect', onClick: () => openConnectDataset(dataSet)
                            }, [
                              span({
                                className: 'cm-icon-button glyphicon glyphicon-link caret-margin ' +
                                  (dataSet.isAssociatedToDataOwners ? 'dataset-color' : 'default-color'), 'aria-hidden': 'true',
                                'data-tip': 'Connect with Data Owner', 'data-for': 'tip_connect'
                              })
                            ])
                          ])
                        ]),

                        td({
                          id: dataSet.alias + '_dataset', name: 'alias',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [dataSet.alias]),

                        td({
                          id: trIndex + '_datasetName', name: 'datasetName',
                          className: 'cell-size ' + (!dataSet.active ? !!'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          a({
                            href: `/dataset_statistics/${dataSet.dataSetId}`,
                            className: 'enabled'
                          }, [
                            findPropertyValue(dataSet, 'Dataset Name')
                          ])
                        ]),
                        td({
                          id: trIndex + '_dac', name: 'dac',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findDacName(dacs, dataSet)
                        ]),

                        td({
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody },
                        [
                          getLinkDisplay(dataSet, trIndex)
                        ]),

                        td({
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          a({
                            id: trIndex + '_linkTranslatedDul', name: 'link_translatedDul',
                            onClick: () => openTranslatedDUL(dataSet.dataUse),
                            className: (!dataSet.active ? 'dataset-disabled' : 'enabled')
                          }, ['Translated Use Restriction'])
                        ]),

                        td({
                          id: trIndex + '_dataType', name: 'dataType',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Data Type')
                        ]),

                        td({
                          id: trIndex + '_phenotype', name: 'phenotype',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Phenotype/Indication')
                        ]),

                        td({
                          id: trIndex + '_pi', name: 'pi', className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Principal Investigator(PI)')
                        ]),

                        td({
                          id: trIndex + '_participants', name: 'participants',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, '# of participants')
                        ]),

                        td({
                          id: trIndex + '_description', name: 'description',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Description')
                        ]),

                        td({
                          id: trIndex + '_species', name: 'species',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Species')
                        ]),

                        td({
                          id: trIndex + '_depositor', name: 'depositor',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Data Depositor')
                        ]),

                        td({
                          id: trIndex + '_consentId', name: 'consentId',
                          className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [dataSet.consentId]),

                        td({
                          id: trIndex + '_scid', name: 'sc-id', className: 'cell-size ' + (!dataSet.active ? 'dataset-disabled' : ''),
                          style: tableBody
                        }, [
                          findPropertyValue(dataSet, 'Sample Collection ID', '---')
                        ]),

                        td({ className: 'cell-size', style: tableBody }, [
                          a({
                            id: trIndex + '_linkDownloadList', name: 'link_downloadList', onClick: () => downloadList(dataSet),
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
            isRendered: isResearcher,
            disabled: (datasetList.filter(row => row.checked).length === 0) || disableApplyAccessButton,
            onClick: () => exportToRequest(),
            className: 'btn-primary dataset-background search-wrapper',
            'data-tip': 'Request Access for selected Datasets', 'data-for': 'tip_requestAccess'
          }, ['Apply for Access'])
        ]),
        h(TranslatedDulModal,{
          isRendered: showTranslatedDULModal,
          showModal: showTranslatedDULModal,
          dataUse: dataUse,
          onOKRequest: okTranslatedDULModal,
          onCloseRequest: closeTranslatedDULModal
        }),

        ConfirmationDialog({
          title: 'Delete Dataset Confirmation?',
          color: 'cancel',
          showModal: showDialogDelete,
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          disableOkBtn: disableOkButton,
          action: { label: 'Yes', handler: dialogHandlerDelete }
        }, [div({ className: 'dialog-description' }, ['Are you sure you want to delete this Dataset?']),]),

        ConfirmationDialog({
          title: 'Disable Dataset Confirmation?',
          color: 'dataset',
          showModal: showDialogDisable,
          alertMessage: errorMessage,
          disableOkBtn: disableOkButton,
          alertTitle: errorTitle,
          action: { label: 'Yes', handler: dialogHandlerDisable }
        }, [div({ className: 'dialog-description' }, ["If you disable a Dataset, Researchers won't be able to request access on it from now on. New Access elections related to this dataset won't be available but opened ones will continue."]),]),

        ConfirmationDialog({
          title: 'Enable Dataset Confirmation?',
          color: 'dataset',
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          showModal: showDialogEnable,
          disableOkBtn: disableOkButton,
          action: { label: 'Yes', handler: dialogHandlerEnable }
        }, [div({ className: 'dialog-description' }, ['If you enable a Dataset, Researchers will be able to request access on it from now on.']),]),

        ConfirmationDialog({
          title: 'Edit Dataset Confirmation?',
          color: 'dataset',
          alertMessage: errorMessage,
          alertTitle: errorTitle,
          showModal: showDialogEdit,
          disableOkBtn: disableOkButton,
          action: { label: 'Yes', handler: dialogHandlerEdit }
        }, [div({ className: 'dialog-description' }, ['Are you sure you want to edit this Dataset?'])]),
        ConnectDatasetModal({
          isRendered: showConnectDatasetModal,
          showModal: showConnectDatasetModal,
          onOKRequest: okConnectDatasetModal,
          onCloseRequest: closeConnectDatasetModal,
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
