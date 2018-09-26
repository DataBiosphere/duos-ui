import { Component, Fragment } from 'react';
import { div, button, table, thead, tbody, th, tr, td, form, h, input, label, span, a, p } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { DataSet, Files } from "../libs/ajax";
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ConnectDatasetModal } from '../components/modals/ConnectDatasetModal';
import { TranslatedDulModal } from '../components/modals/TranslatedDulModal';
import ReactTooltip from 'react-tooltip';
import { SearchBox } from '../components/SearchBox';
import { PaginatorBar } from "../components/PaginatorBar";
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Storage } from "../libs/storage";

class DatasetCatalog extends Component {

  USER_ID = Storage.getCurrentUser().dacUserId;
  // USER_ID = 5;
  constructor(props) {
    super(props);
    this.state = {
      isLogged: false
    };
    this.state = {
      loading: true,
      showConnectDatasetModal: false,
      limit: 5,
      currentPage: null,
      allChecked: false,
      dataSetList: {
        catalog: [],
        dictionary: [],
        showDialogDelete: false,
        showDialogEnable: false,
        showDialogDisable: false,
      }
    };
    this.myHandler = this.myHandler.bind(this);
    this.getDatasets = this.getDatasets.bind(this);

    this.handleOpenConnectDatasetModal = this.handleOpenConnectDatasetModal.bind(this);
    this.handleCloseConnectDatasetModal = this.handleCloseConnectDatasetModal.bind(this);
    this.handleOpenTranslatedDULModal = this.handleOpenTranslatedDULModal.bind(this);
    this.handleCloseTranslatedDULModal = this.handleCloseTranslatedDULModal.bind(this);

    this.openConnectDataset = this.openConnectDataset.bind(this);
    this.closeConnectDatasetModal = this.closeConnectDatasetModal.bind(this);
    this.okConnectDatasetModal = this.okConnectDatasetModal.bind(this);
    this.openTranslatedDUL = this.openTranslatedDUL.bind(this);
    this.closeTranslatedDULModal = this.closeTranslatedDULModal.bind(this);
    this.okTranslatedDULModal = this.okTranslatedDULModal.bind(this);

    this.download = this.download.bind(this);
    this.selectAll = this.selectAll.bind(this);
    this.exportToRequest = this.exportToRequest.bind(this);
  }

  async getDatasets() {
    const dictionary = await DataSet.findDictionary();
    const catalog = await DataSet.findDataSets(this.USER_ID);
    catalog.forEach((row, index) => {
      row.checked = false;
      row.ix = index;
    });
    const data = {
      catalog: catalog,
      dictionary: dictionary
    };
    this.setState({ dataSetList: data, currentPage: 1, loading: false });
  }

  componentDidMount() {
    this.getDatasets();
  }

  handleOpenConnectDatasetModal() {
    this.setState({ showConnectDatasetModal: true });
  }

  handleCloseConnectDatasetModal() {
    this.setState({ showConnectDatasetModal: false });
  }

  handleOpenTranslatedDULModal() {
    this.setState({ showTranslatedDULModal: true });
  }

  handleCloseTranslatedDULModal() {
    this.setState({ showTranslatedDULModal: false });
  }

  downloadList(dataSet) {
    let dataSetId = '';
    dataSet.properties.forEach(property => {
      if (property.propertyName === 'Dataset ID') {
        dataSetId = property.propertyValue;
      }
    });

    Files.getApprovedUsersFile(dataSetId + '-ApprovedRequestors.tsv', dataSetId);
  }

  exportToRequest = () => {
    const listToExport = this.state.dataSetList.catalog.filter(row => row.checked);
    console.log(listToExport);
    this.props.history.push({ pathname: 'dar_application', props: {listToExport} });
  };

  associate() {

  }

  openConnectDataset(dataset) {
    this.setState(prev => {
      prev.datasetConnect = dataset;
      prev.showConnectDatasetModal = true;
      return prev;
    });
  }

  closeConnectDatasetModal() {
    this.setState(prev => {
      prev.showConnectDatasetModal = false;
      return prev;
    });
  }

  okConnectDatasetModal() {
    this.setState(prev => {
      prev.showConnectDatasetModal = false;
      return prev;
    });
  }

  openTranslatedDUL(translatedUR) {
    console.log(translatedUR);
    this.setState(prev => {
      prev.showTranslatedDULModal = true;
      prev.translatedUseRestriction = translatedUR;
      return prev;
    });
  }

  closeTranslatedDULModal() {
    this.setState(prev => {
      prev.showTranslatedDULModal = false;
      return prev;
    });
  }

  okTranslatedDULModal() {
    this.setState(prev => {
      prev.showTranslatedDULModal = false;
      return prev;
    });
  }

  openDelete = (answer) => (e) => {
    this.setState({ showDialogDelete: true });
  };

  openEnable = (answer) => (e) => {
    this.setState({ showDialogEnable: true });
  };

  openDisable = (answer) => (e) => {
    this.setState({ showDialogDisable: true });
  };

  dialogHandlerDelete = (answer) => (e) => {
    this.setState({ showDialogDelete: false });
  };

  dialogHandlerEnable = (answer) => (e) => {
    this.setState({ showDialogEnable: false });
  };

  dialogHandlerDisable = (answer) => (e) => {
    this.setState({ showDialogDisable: false });
  };

  download() {
    const listDownload = this.state.dataSetList.catalog.filter(row => row.checked);
    let dataSetsId = [];
    listDownload[0].properties.forEach(property => {
      if (property.propertyName === 'Dataset ID') {
        dataSetsId.push(property.propertyValue);
      }
    });

    DataSet.downloadDataSets(dataSetsId, 'datasets.tsv');
  }

  myHandler(event) {
    // TBD
  }

  handlePageChange = page => {
    this.setState(prev => {
      prev.currentPage = page;
      return prev;
    });
  };

  handleSizeChange = size => {
    this.setState(prev => {
      prev.limit = size;
      prev.currentPage = 1;
      return prev;
    });
  };

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.includes(query);
    }
    return true;
  };

  selectAll = (e) => {
    const checked = e.target.checked;
    const checkedCatalog = this.state.dataSetList.catalog.map(row => {row.checked = checked; return row;});
    this.setState(prev => {
      prev.allChecked = checked;
      prev.dataSetList.catalog = checkedCatalog;
      return prev;
    });
  };

  checkSingleRow = (index) => (e) => {
    let catalog = this.state.dataSetList.catalog;
    const catalogElement = catalog[index];
    catalogElement.checked = e.target.checked;

    catalog = [
      ...catalog.slice(0, index),
      ...[catalogElement],
      ...catalog.slice(index+1)
    ];

    this.setState(prev => {
      prev.dataSetList.catalog = catalog;
      return prev;
    });
  };

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    const { searchDulText, currentPage, limit } = this.state;

    const isAdmin = true;
    const isResearcher = false;
    return (
      h(Fragment, {}, [
        div({ className: "container container-wide" }, [

          div({ className: "row no-margin" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
              PageHeading({
                id: "datasetCatalog",
                imgSrc: "/images/icon_dataset_.png",
                iconSize: "large",
                color: "dataset",
                title: "Dataset Catalog",
                description: "Datasets with an associated DUL to apply for secondary use"
              }),
            ]),

            div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
              div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
                SearchBox({ id: 'datasetCatalog', searchHandler: this.handleSearchDul, color: 'dataset' })
              ]),
              button({
                id: "btn_downloadSelection",
                download: "",
                disabled: this.state.dataSetList.catalog.filter(row => row.checked).length === 0,
                onClick: this.download,
                className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 download-button dataset-background"
              }, [
                  span({ className: "glyphicon glyphicon-download", "aria-hidden": "true", style: { 'marginRight': '5px' } }),
                  "Download selection"
                ]),
            ]),
          ]),


          div({ className: "table-wrap" }, [
            form({ className: "pos-relative" }, [
              div({ className: "checkbox check-all" }, [
                input({ checked: this.state.allChecked ,type: "checkbox", "select-all": "true", className: "checkbox-inline", id: "chk_selectAll", onChange: this.selectAll }),
                label({ className: "regular-checkbox", htmlFor: "chk_selectAll" }, []),
              ]),
            ]),

            div({ className: isAdmin && !isResearcher ? 'table-scroll-admin' : 'table-scroll' }, [
              table({ className: "table" }, [
                thead({}, [
                  tr({}, [
                    th({}),
                    this.state.dataSetList.dictionary.map((dictionary, dIndex) => {
                      return h(Fragment, { key: dIndex }, [
                        th({ className: "table-titles dataset-color cell-size", id: dictionary.key }, [
                          dictionary.key
                        ])
                      ])
                    }),
                    th({ className: "table-titles dataset-color cell-size" }, ["ConsentId"]),
                    th({ className: "table-titles dataset-color cell-size" }, ["Structured Data Use Limitations"]),
                    th({ isRendered: isAdmin, className: "table-titles dataset-color cell-size" }, ["Approved Requestors"]),
                  ]),
                ]),

                tbody({}, [
                  this.state.dataSetList.catalog.filter(this.searchTable(searchDulText)).slice((currentPage - 1) * limit, currentPage * limit).map((dataSet, trIndex) => {
                    // this.state.dataSetList.catalog.map((dataSet, trIndex) => {
                    return h(Fragment, { key: trIndex }, [

                      tr({ className: "tableRow" }, [
                        dataSet.properties.map((property, dIndex) => {
                          return h(Fragment, { key: dIndex }, [

                            td({
                              isRendered: property.propertyName === 'Dataset ID'
                            }, [
                                div({ className: "checkbox" }, [
                                  input({
                                    type: "checkbox",
                                    id: trIndex + "_chkSelect",
                                    name: "chk_select",
                                    // , value: "checkMod['field_' + pagination.current + $parent.$parent.$index]"
                                    checked: dataSet.checked, className: "checkbox-inline user-checkbox", "add-object-id": "true", onChange: this.checkSingleRow(dataSet.ix)
                                  }),
                                  label({ className: "regular-checkbox rp-choice-questions", htmlFor: trIndex + "_chkSelect" }),
                                ])
                              ])
                          ])
                        }),

                        dataSet.properties.map((property, dIndex) => {
                          return h(Fragment, { key: dIndex }, [

                            td({ className: "fixed-col", isRendered: property.propertyName === 'Dataset ID' && isAdmin && !isResearcher }, [
                              div({ className: "dataset-actions" }, [
                                a({ id: trIndex + "_btnDelete", name: "btn_delete", onClick: this.openDelete(property.propertyValue), disabled: !dataSet.deletable }, [
                                  span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin " + (dataSet.deletable ? "default-color" : ""), "aria-hidden": "true", "data-tip": "", "data-for": "tip_delete" })
                                ]),
                                h(ReactTooltip, { id: "tip_delete", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Delete dataset"]),

                                a({ id: trIndex + "_btnDisable", name: "btn_disable", isRendered: dataSet.active, onClick: this.openDisable(property.propertyValue) }, [
                                  span({ className: "cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color", "aria-hidden": "true", "data-tip": "", "data-for": "tip_disable" })
                                ]),
                                h(ReactTooltip, { id: "tip_disable", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Disable dataset"]),

                                a({ id: trIndex + "_btnEnable", name: "btn_enable", isRendered: !dataSet.active, onClick: this.openEnable(property.propertyValue) }, [
                                  span({ className: "cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color", "aria-hidden": "true", "data-tip": "", "data-for": "tip_enable" })
                                ]),
                                h(ReactTooltip, { id: "tip_enable", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Enable dataset"]),

                                a({ id: trIndex + "_btnConnect", name: "btn_connect", onClick: () => this.openConnectDataset(dataSet)
                                  // onClick: this.associate(property.propertyValue, dataSet.needsApproval)
                                }, [
                                    span({ className: "cm-icon-button glyphicon glyphicon-link caret-margin " + (dataSet.isAssociatedToDataOwners ? 'dataset-color' : 'default-color'), "aria-hidden": "true", "data-tip": "", "data-for": "tip_connect" })
                                  ]),
                                h(ReactTooltip, { id: "tip_connect", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Connect with Data Owner"])
                              ])
                            ])
                          ])
                        }),

                        dataSet.properties.map((property, dIndex) => {
                          return h(Fragment, { key: dIndex }, [
                            td({ className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [
                                p({ isRendered: property.propertyName !== 'dbGAP' }, [
                                  span({ id: trIndex + "_datasetName", name: "datasetName", isRendered: property.propertyName === 'Dataset Name' }),
                                  span({ id: trIndex + "_datasetId", name: "datasetId", isRendered: property.propertyName === 'Dataset ID' }),
                                  span({ id: trIndex + "_dataType", name: "dataType", isRendered: property.propertyName === 'Data Type' }),
                                  span({ id: trIndex + "_species", name: "species", isRendered: property.propertyName === 'Species' }),
                                  span({ id: trIndex + "_phenotype", name: "phenotype", isRendered: property.propertyName === 'Phenotype/Indication' }),
                                  span({ id: trIndex + "_participants", name: "participants", isRendered: property.propertyName === '# of participants' }),
                                  span({ id: trIndex + "_description", name: "description", isRendered: property.propertyName === 'Description' }),
                                  property.propertyValue
                                ]),

                                a({
                                  id: trIndex + "_linkdbGap",
                                  name: "link_dbGap",
                                  isRendered: property.propertyName === 'dbGAP',
                                  href: property.propertyValue,
                                  target: "_blank",
                                  className: (property.propertyValue.length > 0 ? 'enabled' : property.propertyValue.length === 0 ? 'disabled' : '')
                                }, ["Link"]),
                              ])
                          ])
                        }),

                        td({ id: trIndex + "_consentId", name: "consentId", className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [dataSet.consentId]),

                        td({ className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [
                          a({
                           id: trIndex + "_linkTranslatedDul", name: "link_translatedDul",
                    onClick: () => this.openTranslatedDUL(dataSet.translatedUseRestriction), className: "enabled" }, ["Translated Use Restriction"])
                        ]),

                        td({ isRendered: isAdmin, className: "table-items cell-size" }, [
                          a({ id: trIndex + "_linkDownloadList", name: "link_downloadList", onClick: () => this.downloadList(dataSet), className: "enabled" }, ["Download List"]),
                        ]),
                      ]),
                    ]);
                  })
                ])
              ])
            ]),
            div({ style: { 'margin': '0 20px 15px 20px' } }, [
              PaginatorBar({
                total: this.state.dataSetList.catalog.filter(this.searchTable(searchDulText)).length,
                limit: this.state.limit,
                currentPage: this.state.currentPage,
                onPageChange: this.handlePageChange,
                changeHandler: this.handleSizeChange,
              })
            ])
          ]),

          div({ className: "f-right" }, [
            button({
              isRendered: this.isResearcher,
              disabled: this.state.dataSetList.catalog.filter(row => row.checked) > 0,
              onClick: this.exportToRequest,
              className: "download-button dataset-background apply-dataset",
              "data-tip": "", "data-for": "tip_requestAccess"
            }, ["Apply for Access"]),
            h(ReactTooltip, { id: "tip_requestAccess", effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Request Access for selected Datasets"]),
          ]),
          TranslatedDulModal({
            showModal: this.state.showTranslatedDULModal,
            onOKRequest: this.okTranslatedDULModal,
            onCloseRequest: this.closeTranslatedDULModal,
            translatedUseRestriction: this.state.translatedUseRestriction,
          }),

          ConfirmationDialog({
            title: 'Delete Dataset Confirmation?', color: 'cancel', showModal: this.state.showDialogDelete, action: { label: "Yes", handler: this.dialogHandlerDelete }
          }, [div({ className: "dialog-description" }, ["Are you sure you want to delete this Dataset?"]),]),

          ConfirmationDialog({
            title: 'Disable Dataset Confirmation?', color: 'dataset', showModal: this.state.showDialogDisable, action: { label: "Yes", handler: this.dialogHandlerDisable }
          }, [div({ className: "dialog-description" }, ["If you disable a Dataset, Researchers won't be able to request access on it from now on. New Access elections related to this dataset won't be available but opened ones will continue."]),]),

          ConfirmationDialog({
            title: 'Enable Dataset Confirmation?', color: 'dataset', showModal: this.state.showDialogEnable, action: { label: "Yes", handler: this.dialogHandlerEnable }
          }, [div({ className: "dialog-description" }, ["If you enable a Dataset, Researchers will be able to request access on it from now on."]),]),

          ConnectDatasetModal({
            isRendered: this.state.showConnectDatasetModal,
            showModal: this.state.showConnectDatasetModal,
            onOKRequest: this.okConnectDatasetModal,
            onCloseRequest: this.closeConnectDatasetModal,
            dataset: this.state.datasetConnect
          }),
        ])
      ])
    );
  }
}

export default DatasetCatalog;

