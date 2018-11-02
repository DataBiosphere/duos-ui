import { Component, Fragment } from 'react';
import { div, button, table, thead, tbody, th, tr, td, form, h, input, label, span, a, p } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { DataSet, Researcher, Files, DAR } from "../libs/ajax";
import { Storage } from "../libs/storage";
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ConnectDatasetModal } from '../components/modals/ConnectDatasetModal';
import { TranslatedDulModal } from '../components/modals/TranslatedDulModal';
import ReactTooltip from 'react-tooltip';
import { SearchBox } from '../components/SearchBox';
import { PaginatorBar } from "../components/PaginatorBar";

class DatasetCatalog extends Component {

  currentUser = {};

  USER_ID = Storage.getCurrentUser().dacUserId;

  constructor(props) {
    super(props);

    this.state = {
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
      },
      disableOkButton: false,
      translatedUseRestrictionModal: {},
      isAdmin: null,
      isResearcher: null,
    };
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

    if (this.state.isResearcher && '?reviewProfile' === this.props.location.search) {
      const researcher = await Researcher.getPropertiesByResearcherId(Storage.getCurrentUser().dacUserId);
      if (researcher.completed !== 'true') {
        this.props.history.push('researcher_profile');
      }
    }

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

    this.setState({
      dataSetList: data,
      currentPage: 1
    });
  }

  componentDidMount() {

    this.currentUser = Storage.getCurrentUser();
    this.setState({
      isAdmin: this.currentUser.isAdmin,
      isResearcher: this.currentUser.isResearcher
    }, async () => {
      await this.getDatasets();
      ReactTooltip.rebuild();
    });
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

  downloadList(dataset) {
    Files.getApprovedUsersFile(dataset.dataSetId + '-ApprovedRequestors.tsv', dataset.dataSetId);
  }

  async exportToRequest() {
    let listToExport = [];
    this.state.dataSetList.catalog.filter(row => row.checked).forEach(dataset => {
      listToExport.push(dataset.dataSetId);
    });

    const formData = await DAR.partialDarFromCatalogPost(this.USER_ID, listToExport);
    this.props.history.push({ pathname: 'dar_application', props: { formData: formData } });
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
    }, () => this.getDatasets());
  }

  openTranslatedDUL = (translatedUseRestriction) => () => {
    this.setState(prev => {
      prev.translatedUseRestrictionModal = translatedUseRestriction;
      prev.showTranslatedDULModal = true;
      return prev;
    });
  };

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

  openDelete = (datasetId) => (e) => {
    this.setState({
      showDialogDelete: true,
      datasetId: datasetId
    });
  };

  openEnable = (datasetId) => (e) => {
    this.setState({
      showDialogEnable: true,
      datasetId: datasetId
    });
  };

  openDisable = (datasetId) => (e) => {
    this.setState({
      showDialogDisable: true,
      datasetId: datasetId
    });
  };

  dialogHandlerDelete = (answer) => (e) => {
    this.setState({ disableOkButton: true });
    if (answer) {
      DataSet.deleteDataset(this.state.datasetId, this.USER_ID).then(resp => {
        this.getDatasets();
        this.setState({ showDialogDelete: false, disableOkButton: false });
      }).catch(error => {
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

  dialogHandlerEnable = (answer) => (e) => {
    this.setState({ disableOkButton: true });
    if (answer) {
      DataSet.disableDataset(this.state.datasetId, true).then(resp => {
        this.getDatasets();
        this.setState({ showDialogEnable: false, disableOkButton: false });
      }).catch(error => {
        this.setState(prev => {
          prev.showDialogEnable = true;
          prev.alertMessage = 'Please try again later.';
          prev.alertTitle = 'Something went wrong';
          return prev;
        });
      });
    } else {
      this.setState({ showDialogEnagle: false, alertMessage: undefined, alertTitle: undefined, disableOkButton: false });
    }

  };

  dialogHandlerDisable = (answer) => (e) => {
    this.setState({ disableOkButton: true });
    if (answer) {
      DataSet.disableDataset(this.state.datasetId, false).then(resp => {
        this.getDatasets();
        this.setState({ showDialogDisable: false, disableOkButton: false });
      }).catch(error => {
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

  download() {
    const listDownload = this.state.dataSetList.catalog.filter(row => row.checked);
    let dataSetsId = [];
    listDownload.forEach(dataset => {
      dataSetsId.push(dataset.dataSetId);
    });
    DataSet.downloadDataSets(dataSetsId, 'datasets.tsv');
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
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  selectAll = (e) => {
    const checked = e.target.checked;
    const checkedCatalog = this.state.dataSetList.catalog.map(row => { row.checked = checked; return row; });
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
      ...catalog.slice(index + 1)
    ];

    this.setState(prev => {
      prev.dataSetList.catalog = catalog;
      return prev;
    });
  };

  render() {

    const { searchDulText, currentPage, limit } = this.state;

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
                h(SearchBox, { id: 'datasetCatalog', searchHandler: this.handleSearchDul, pageHandler: this.handlePageChange, color: 'dataset' })
              ]),
              button({
                id: "btn_downloadSelection",
                download: "",
                disabled: this.state.dataSetList.catalog.filter(row => row.checked).length === 0,
                onClick: this.download,
                className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary dataset-background"
              }, [
                  "Download selection",
                  span({ className: "glyphicon glyphicon-download", style: { 'marginLeft': '5px' }, "aria-hidden": "true" })
                ]),
            ]),
          ]),


          div({ className: "table-wrap" }, [
            form({ className: "pos-relative" }, [
              div({ className: "checkbox check-all" }, [
                input({ checked: this.state.allChecked, type: "checkbox", "select-all": "true", className: "checkbox-inline", id: "chk_selectAll", onChange: this.selectAll }),
                label({ className: "regular-checkbox", htmlFor: "chk_selectAll" }, []),
              ]),
            ]),

            div({ className: this.state.isAdmin && !this.state.isResearcher ? 'table-scroll-admin' : 'table-scroll' }, [
              table({ className: "table" }, [
                thead({}, [
                  tr({}, [
                    th({}),
                    th({ className: "table-titles dataset-color cell-size" }, ["Dataset Id"]),
                    this.state.dataSetList.dictionary.map((dictionary, dIndex) => {
                      return h(Fragment, { key: dIndex }, [
                        th({isRendered: dictionary.key !== 'Sample Collection ID', className: "table-titles dataset-color cell-size", id: dictionary.key }, [
                          dictionary.key
                        ])
                      ])
                    }),
                    th({ className: "table-titles dataset-color cell-size" }, ["Consent Id"]),
                    th({ className: "table-titles dataset-color cell-size" }, ["SC-ID"]),
                    th({ className: "table-titles dataset-color cell-size" }, ["Structured Data Use Limitations"]),
                    th({ isRendered: this.state.isAdmin, className: "table-titles dataset-color cell-size" }, ["Approved Requestors"]),
                  ]),
                ]),

                tbody({}, [
                  this.state.dataSetList.catalog.filter(this.searchTable(searchDulText)).slice((currentPage - 1) * limit, currentPage * limit).map((dataSet, trIndex) => {
                    return h(Fragment, { key: trIndex }, [

                      tr({ className: "tableRow" }, [
                        dataSet.properties.map((property, dIndex) => {
                          return h(Fragment, { key: dIndex }, [

                            td({
                              isRendered: property.propertyName === 'Sample Collection ID'
                            }, [
                                div({ className: "checkbox" }, [
                                  input({
                                    type: "checkbox",
                                    id: trIndex + "_chkSelect",
                                    name: "chk_select",
                                    checked: dataSet.checked, className: "checkbox-inline user-checkbox", "add-object-id": "true", onChange: this.checkSingleRow(dataSet.ix)
                                  }),
                                  label({ className: "regular-checkbox rp-choice-questions", htmlFor: trIndex + "_chkSelect" }),
                                ])
                              ])
                          ])
                        }),

                        dataSet.properties.map((property, dIndex) => {
                          return h(Fragment, { key: dIndex }, [

                            td({ className: "fixed-col", isRendered: property.propertyName === 'Sample Collection ID' && this.state.isAdmin && !this.state.isResearcher }, [
                              div({ className: "dataset-actions" }, [
                                a({ id: trIndex + "_btnDelete", name: "btn_delete", onClick: this.openDelete(dataSet.dataSetId), disabled: !dataSet.deletable }, [
                                  span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin " + (dataSet.deletable ? "default-color" : ""), "aria-hidden": "true", "data-tip": "Delete dataset", "data-for": "tip_delete" })
                                ]),

                                a({ id: trIndex + "_btnDisable", name: "btn_disable", isRendered: dataSet.active, onClick: this.openDisable(dataSet.dataSetId) }, [
                                  span({ className: "cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color", "aria-hidden": "true", "data-tip": "Disable dataset", "data-for": "tip_disable" })
                                ]),

                                a({ id: trIndex + "_btnEnable", name: "btn_enable", isRendered: !dataSet.active, onClick: this.openEnable(dataSet.dataSetId) }, [
                                  span({ className: "cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color", "aria-hidden": "true", "data-tip": "Enable dataset", "data-for": "tip_enable" })
                                ]),

                                a({
                                  id: trIndex + "_btnConnect", name: "btn_connect", onClick: () => this.openConnectDataset(dataSet)
                                }, [
                                    span({ className: "cm-icon-button glyphicon glyphicon-link caret-margin " + (dataSet.isAssociatedToDataOwners ? 'dataset-color' : 'default-color'), "aria-hidden": "true", "data-tip": "Connect with Data Owner", "data-for": "tip_connect" })
                                  ]),
                              ])
                            ])
                          ])
                        }),

                        td({ id: dataSet.alias + "_dataset", name: "alias", className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [dataSet.alias]),
                        dataSet.properties.map((property, dIndex) => {
                          return h(Fragment, { key: dIndex }, [
                            td({ isRendered: property.propertyName !== 'Sample Collection ID', className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [
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
                        td({ id: trIndex + "_scid", name: "sc-id", className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [dataSet.properties[1].propertyValue === '' ? "---" : dataSet.properties[1].propertyValue]),
                        td({ className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [
                          a({ id: trIndex + "_linkTranslatedDul", name: "link_translatedDul", onClick: this.openTranslatedDUL(dataSet.translatedUseRestriction), className: (!dataSet.active ? 'dataset-disabled' : 'enabled') }, ["Translated Use Restriction"])
                        ]),

                        td({ isRendered: this.state.isAdmin, className: "table-items cell-size" }, [
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
              id: "btn_applyAccess",
              isRendered: this.state.isResearcher,
              disabled: this.state.dataSetList.catalog.filter(row => row.checked).length === 0,
              onClick: () => this.exportToRequest(),
              className: "btn-primary dataset-background search-wrapper",
              "data-tip": "Request Access for selected Datasets", "data-for": "tip_requestAccess"
            }, ["Apply for Access"])
          ]),
          TranslatedDulModal({
            isRendered: this.state.showTranslatedDULModal,
            showModal: this.state.showTranslatedDULModal,
            useRestriction: this.state.translatedUseRestrictionModal,
            onOKRequest: this.okTranslatedDULModal,
            onCloseRequest: this.closeTranslatedDULModal
          }),

          ConfirmationDialog({
            title: 'Delete Dataset Confirmation?',
            color: 'cancel',
            showModal: this.state.showDialogDelete,
            alertMessage: this.state.errorMessage,
            alertTitle: this.state.alertTitle,
            disableOkBtn: this.state.disableOkButton,
            action: { label: "Yes", handler: this.dialogHandlerDelete }
          }, [div({ className: "dialog-description" }, ["Are you sure you want to delete this Dataset?"]),]),

          ConfirmationDialog({
            title: 'Disable Dataset Confirmation?',
            color: 'dataset',
            showModal: this.state.showDialogDisable,
            alertMessage: this.state.errorMessage,
            disableOkBtn: this.state.disableOkButton,
            alertTitle: this.state.alertTitle,
            action: { label: "Yes", handler: this.dialogHandlerDisable }
          }, [div({ className: "dialog-description" }, ["If you disable a Dataset, Researchers won't be able to request access on it from now on. New Access elections related to this dataset won't be available but opened ones will continue."]),]),

          ConfirmationDialog({
            title: 'Enable Dataset Confirmation?',
            color: 'dataset',
            alertMessage: this.state.errorMessage,
            alertTitle: this.state.alertTitle,
            showModal: this.state.showDialogEnable,
            disableOkBtn: this.state.disableOkButton,
            action: { label: "Yes", handler: this.dialogHandlerEnable }
          }, [div({ className: "dialog-description" }, ["If you enable a Dataset, Researchers will be able to request access on it from now on."]),]),

          ConnectDatasetModal({
            isRendered: this.state.showConnectDatasetModal,
            showModal: this.state.showConnectDatasetModal,
            onOKRequest: this.okConnectDatasetModal,
            onCloseRequest: this.closeConnectDatasetModal,
            dataset: this.state.datasetConnect,
          }),
          h(ReactTooltip, {
            id: "tip_delete",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_disable",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_enable",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_connect",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_requestAccess",
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          })
        ])
      ])
    );
  }
}

export default DatasetCatalog;

