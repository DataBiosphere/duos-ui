import find from 'lodash/find';
import get from 'lodash/get';
import isNil from 'lodash/isNil';
import some from 'lodash/some';
import { Fragment, useEffect, useState } from 'react';
import { a, button, div, form, h, input, label, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ConnectDatasetModal } from '../components/modals/ConnectDatasetModal';
import TranslatedDulModal from '../components/modals/TranslatedDulModal';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { DAC, DAR, DataSet, Files } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { Theme } from '../libs/theme';
import datasetIcon from '../images/icon_dataset_.png';

const tableBody = {
  ...Theme.textTableBody,
  padding: '8px 5px 8px 5px'
};

export default function DatasetCatalog(props) {

  const [dataSetList, setDataSetList] = useState({
    catalog: [],
    showDialogDelete: false,
    showDialogEnable: false,
    showDialogDisable: false,
    showDialogEdit: false
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [allChecked, setAllChecked] = useState(false);
  const [dataUse, setDataUse] = useState();
  const [dacs, setDacs] = useState([]);
  const [disableOkButton, setDisableOkButton] = useState(false);
  const [disableApplyAccessButton, setDisableApplyAccessButton] = useState(true);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isResearcher, setIsResearcher] = useState(null);
  const [showConnectDatasetModal, setShowConnectDatasetModal] = useState(false);
  const [showTranslatedDULModal, setShowTranslatedDULModal] = useState();
  const [searchDulText, setSearchDulText] = useState();

  // Initialize page data
  useEffect( () => {
    const init = async() => {
      const currentUser = Storage.getCurrentUser();
      setIsAdmin(currentUser.isAdmin);
      setIsResearcher(currentUser.isResearcher);
      const catalogPromises = await Promise.all([
        getDatasets(),
        getDacs()
      ]);
      const datasets = catalogPromises[0];
      const dacs = catalogPromises[1];
      setDataSetList(datasets);
      setDacs(dacs);
    };
    init();
  }, []);

  const getDatasets = async () => {
    let catalog = await DataSet.getDatasets();
    catalog.forEach((row, index) => {
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
    return catalog;
  };

  const getDacs = async () => {
    let dacs = await DAC.list(false);
    let dacIdsAndNames = dacs.map(dac => {
      return {id: dac.dacId, name: dac.name};
    });
    return dacIdsAndNames;
  };

  const downloadList = (dataset) => {
    Files.getApprovedUsersFile(dataset.dataSetId + '-ApprovedRequestors.tsv', dataset.dataSetId);
  };

  const exportToRequest = async () => {
    let datasets = [];
    let datasetIdList = [];
    dataSetList.catalog.filter(row => row.checked)
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
    // TODO: Fix
    this.setState(prev => {
      prev.datasetConnect = dataset;
      // prev.showConnectDatasetModal = true;
      return prev;
    });
  };

  const closeConnectDatasetModal = () => {
    setShowConnectDatasetModal(false);
  };

  const okConnectDatasetModal = () => {
    setShowConnectDatasetModal(false);
    // TODO: Fix
    this.setState(prev => {
      // prev.showConnectDatasetModal = false;
      return prev;
    }, () => this.getDatasets());
  };

  const openTranslatedDUL = (dataUse) => {
    setDataUse(dataUse);
    setShowTranslatedDULModal(true);
    // this.setState(prev => {
    //   // prev.dataUse = dataUse;
    //   // prev.showTranslatedDULModal = true;
    //   return prev;
    // });
  };

  const closeTranslatedDULModal = () => {
    setShowTranslatedDULModal(false);
    // this.setState(prev => {
    //   prev.showTranslatedDULModal = false;
    //   return prev;
    // });
  };

  const okTranslatedDULModal = () => {
    this.setState(prev => {
      prev.showTranslatedDULModal = false;
      return prev;
    });
  };

  const openDelete = (datasetId) => () => {
    this.setState({
      showDialogDelete: true,
      datasetId: datasetId
    });
  };

  const openEdit = (datasetId) => () => {
    this.setState({
      showDialogEdit: true,
      datasetId: datasetId
    });
  };

  const openEnable = (datasetId) => () => {
    this.setState({
      showDialogEnable: true,
      datasetId: datasetId
    });
  };

  const openDisable = (datasetId) => () => {
    this.setState({
      showDialogDisable: true,
      datasetId: datasetId
    });
  };

  const dialogHandlerDelete = (answer) => () => {
    setDisableOkButton(true);
    // this.setState({ disableOkButton: true });
    if (answer) {
      DataSet.deleteDataset(this.state.datasetId).then(() => {
        getDatasets();
        setDisableOkButton(false);
        this.setState({ showDialogDelete: false });
      }).catch(() => {
        this.setState(prev => {
          prev.showDialogDelete = true;
          prev.alertMessage = 'Please try again later.';
          prev.alertTitle = 'Something went wrong';
          return prev;
        });
      });
    } else {
      this.setState({ showDialogDelete: false, alertMessage: undefined, alertTitle: undefined, disableOkButton: false });
    }
  };

  const dialogHandlerEnable = (answer) => () => {
    setDisableOkButton(true);
    // this.setState({ disableOkButton: true });
    if (answer) {
      DataSet.disableDataset(this.state.datasetId, true).then(() => {
        getDatasets();
        setDisableOkButton(false);
        this.setState({ showDialogEnable: false });
      }).catch(() => {
        this.setState(prev => {
          prev.showDialogEnable = true;
          prev.alertMessage = 'Please try again later.';
          prev.alertTitle = 'Something went wrong';
          return prev;
        });
      });
    } else {
      this.setState({ showDialogEnable: false, alertMessage: undefined, alertTitle: undefined, disableOkButton: false });
    }

  };

  const dialogHandlerDisable = (answer) => () => {
    setDisableOkButton(true);
    // this.setState({ disableOkButton: true });
    if (answer) {
      DataSet.disableDataset(this.state.datasetId, false).then(() => {
        getDatasets();
        setDisableOkButton(false);
        this.setState({ showDialogDisable: false });
      }).catch(() => {
        this.setState(prev => {
          prev.alertMessage = 'Please try again later.';
          prev.alertTitle = 'Something went wrong';
          this.setState({ showDialogDisable: true });
          return prev;
        });
      });
    } else {
      this.setState({ showDialogDisable: false, alertMessage: undefined, alertTitle: undefined });
    }
  };

  const dialogHandlerEdit = (answer) => () => {
    setDisableOkButton(true);
    // this.setState({ disableOkButton: true });
    if (answer) {
      setDisableOkButton(false);
      this.setState(prev => {
        this.setState({ showDialogEdit: false });
        return prev;
      });
      let datasetId = this.state.datasetId;
      props.history.push({ pathname: `dataset_registration/${datasetId}` });
    } else {
      this.setState({ showDialogEdit: false, alertMessage: undefined, alertTitle: undefined, disableOkButton: false });
    }
  };

  const download = () => {
    const listDownload = dataSetList.catalog.filter(row => row.checked);
    let dataSetsId = [];
    listDownload.forEach(dataset => {
      dataSetsId.push(dataset.dataSetId);
    });
    DataSet.downloadDataSets(dataSetsId, 'datasets.tsv');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // this.setState(prev => {
    //   prev.currentPage = page;
    //   return prev;
    // });
  };

  const handleSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
    // this.setState(prev => {
    //   prev.pageSize = size;
    //   prev.currentPage = 1;
    //   return prev;
    // });
  };

  const handleSearchDul = (query) => {
    setSearchDulText(query);
    // this.setState({ searchDulText: query });
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
    const catalog = dataSetList.catalog;
    const checkedCatalog = catalog.map(row => { row.checked = checked; return row; });
    const disabledChecked = some(catalog, {'checked': true, 'active': false});
    setAllChecked(checked);
    setDisableApplyAccessButton(disabledChecked);
    this.setState(prev => {
      // prev.allChecked = checked;
      prev.dataSetList.catalog = checkedCatalog;
      // prev.disableApplyAccessButton = disabledChecked;
      return prev;
    });
  };

  const checkSingleRow = (index) => (e) => {
    let catalog = dataSetList.catalog;
    const catalogElement = catalog[index];
    catalogElement.checked = e.target.checked;

    catalog = [
      ...catalog.slice(0, index),
      ...[catalogElement],
      ...catalog.slice(index + 1)
    ];

    const disabledChecked = some(catalog, {'checked': true, 'active': false});

    setDisableApplyAccessButton(disabledChecked);
    this.setState(prev => {
      prev.dataSetList.catalog = catalog;
      // prev.disableApplyAccessButton = disabledChecked;
      return prev;
    });
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
          div({ className: 'right', isRendered: (this.state.isAdmin || this.state.isChairPerson) }, [
            div({ className: 'col-lg-7 col-md-7 col-sm-7 col-xs-7 search-wrapper' }, [
              h(SearchBox, { id: 'datasetCatalog', searchHandler: handleSearchDul, pageHandler: this.handlePageChange, color: 'dataset' })
            ]),
            button({
              id: 'btn_addDataset',
              isRendered: this.state.isAdmin,
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

              tbody({}, [
                dataSetList.catalog.filter(searchTable(searchDulText))
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

                        td({ isRendered: this.state.isAdmin, style: { minWidth: '14rem' } }, [
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
              total: dataSetList.catalog.filter(searchTable(searchDulText)).length,
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
            disabled: dataSetList.catalog.filter(row => row.checked).length === 0,
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
            disabled: (dataSetList.catalog.filter(row => row.checked).length === 0) || disableApplyAccessButton,
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
          showModal: this.state.showDialogDelete,
          alertMessage: this.state.errorMessage,
          alertTitle: this.state.alertTitle,
          disableOkBtn: disableOkButton,
          action: { label: 'Yes', handler: dialogHandlerDelete }
        }, [div({ className: 'dialog-description' }, ['Are you sure you want to delete this Dataset?']),]),

        ConfirmationDialog({
          title: 'Disable Dataset Confirmation?',
          color: 'dataset',
          showModal: this.state.showDialogDisable,
          alertMessage: this.state.errorMessage,
          disableOkBtn: disableOkButton,
          alertTitle: this.state.alertTitle,
          action: { label: 'Yes', handler: dialogHandlerDisable }
        }, [div({ className: 'dialog-description' }, ["If you disable a Dataset, Researchers won't be able to request access on it from now on. New Access elections related to this dataset won't be available but opened ones will continue."]),]),

        ConfirmationDialog({
          title: 'Enable Dataset Confirmation?',
          color: 'dataset',
          alertMessage: this.state.errorMessage,
          alertTitle: this.state.alertTitle,
          showModal: this.state.showDialogEnable,
          disableOkBtn: disableOkButton,
          action: { label: 'Yes', handler: dialogHandlerEnable }
        }, [div({ className: 'dialog-description' }, ['If you enable a Dataset, Researchers will be able to request access on it from now on.']),]),

        ConfirmationDialog({
          title: 'Edit Dataset Confirmation?',
          color: 'dataset',
          alertMessage: this.state.errorMessage,
          alertTitle: this.state.alertTitle,
          showModal: this.state.showDialogEdit,
          disableOkBtn: disableOkButton,
          action: { label: 'Yes', handler: dialogHandlerEdit }
        }, [div({ className: 'dialog-description' }, ['Are you sure you want to edit this Dataset?'])]),
        ConnectDatasetModal({
          isRendered: showConnectDatasetModal,
          showModal: showConnectDatasetModal,
          onOKRequest: okConnectDatasetModal,
          onCloseRequest: closeConnectDatasetModal,
          dataset: this.state.datasetConnect,
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
