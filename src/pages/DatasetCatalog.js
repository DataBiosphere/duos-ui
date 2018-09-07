import { Component, Fragment } from 'react';
import { div, button, table, thead, tbody, th, tr, td, form, h, input, label, i, span, a, p } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { DataSet } from "../libs/ajax";
import { ConfirmationDialog } from '../components/ConfirmationDialog';


const USER_ID = 5;
class DatasetCatalog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLogged: false
    }
    this.state = {
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
  }

  async getDatasets() {
    const dictionary = await DataSet.getDictionary();
    const catalog = await DataSet.list(USER_ID);
    const data = {
      catalog: catalog,
      dictionary: dictionary
    }
    this.setState({ dataSetList: data }, () => { console.log(this.state) });
  }


  componentWillMount() {
    this.getDatasets();
  }

  componentDidMount() {

  }

  showSdul() {

  }

  downloadList() {

  }

  exportToRequest() {

  }

  associate() {

  }

  openDelete = (answer) => (e) => {
    this.setState({ showDialogDelete: true });
  }

  openEnable = (answer) => (e) => {
    this.setState({ showDialogEnable: true });
  }

  openDisable = (answer) => (e) => {
    this.setState({ showDialogDisable: true });
  }

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

  }

  myHandler(event) {
    // TBD
  }

  render() {
    const isAdmin = true;
    const isResearcher = false;
    const objectIdList = ['a', 'b', 'c'];
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

            div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
                div({ className: "search-text" }, [
                  i({ className: "glyphicon glyphicon-search dataset-color" }),
                  input({
                    id: "txt_search",
                    type: "search",
                    className: "form-control users-search",
                    placeholder: "Enter search term...",
                    value: "searchDataset"
                  })
                ]),
              ]),
              button({
                download: "", disabled: objectIdList.length === 0, onClick: this.download(objectIdList),
                className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 download-button dataset-background"
              }, [
                  span({ className: "cm-icon-button glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }, []),
                  span({}, ["Download selection"]),
                ]),
            ]),
          ]),


          div({ className: "table-wrap" }, [

            form({ className: "pos-relative" }, [
              div({ className: "checkbox check-all" }, [
                input({ type: "checkbox", "select-all": "true", className: "checkbox-inline", id: "all" }),
                label({ className: "regular-checkbox", htmlFor: "all" }, []),
              ]),
            ]),

            div({ className: isAdmin && !isResearcher ? 'table-scroll-admin' : 'table-scroll' }, [
              table({ className: "table" }, [

                thead({}, [
                  tr({}, [
                    th({}),
                    this.state.dataSetList.dictionary.map(dictionary => {
                      return h(Fragment, {}, [
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

                  this.state.dataSetList.catalog.map((dataSet, trIndex) => {
                    return h(Fragment, {}, [

                      tr({
                        id: 'tr-' + dataSet.dataSetId,
                        "dir-paginate": "dataSet in DatasetCatalog.dataSetList.catalog | filter: searchDataset | itemsPerPage:10"
                        , "current-page": "pagination.current"
                      }, [

                          dataSet.properties.map(property => {
                            return h(Fragment, {}, [

                              td({
                                isRendered: property.propertyName === 'Dataset ID',
                                id: property.propertyName + '-' + trIndex
                              }, [
                                  div({ className: "checkbox" }, [
                                    input({
                                      type: "checkbox", id: property.propertyValue
                                      // , value: "checkMod['field_' + pagination.current + $parent.$parent.$index]"
                                      , value: "true", className: "checkbox-inline user-checkbox", "add-object-id": "true"
                                    }),
                                    label({ className: "regular-checkbox rp-choice-questions", for: property.propertyValue }),
                                  ])
                                ])
                            ])
                          }),

                          dataSet.properties.map(property => {
                            return h(Fragment, {}, [

                              td({
                                className: "fixed-col", id: 'td-' + property.propertyName,
                                isRendered: property.propertyName === 'Dataset ID' && isAdmin && !isResearcher
                              }, [

                                  div({ className: "dataset-actions" }, [
                                    a({
                                      onClick: this.openDelete(property.propertyValue), disabled: !dataSet.deletable
                                      // tooltip: "Delete dataset", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                    }, [span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin " + (dataSet.deletable ? "default-color" : ""), "aria-hidden": "true" })
                                      ]),

                                    a({
                                      isRendered: dataSet.active, onClick: this.openDisable(property.propertyValue)
                                      // "tooltip": "Disable dataset", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                    }, [span({ className: "cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color", "aria-hidden": "true" })
                                      ]),

                                    a({
                                      isRendered: !dataSet.active, onClick: this.openEnable(property.propertyValue)
                                      // "tooltip": "Enable dataset", "tooltip-className": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                    }, [span({ className: "cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color", "aria-hidden": "true" }),
                                      ]),


                                    a({
                                      onClick: this.associate(property.propertyValue, dataSet.needsApproval),
                                      // "tooltip": "Connect with Data Owner", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                    }, [span({ className: "cm-icon-button glyphicon glyphicon-link caret-margin " + (dataSet.isAssociatedToDataOwners ? 'dataset-color' : 'default-color'), "aria-hidden": "true" }),
                                      ]),

                                    ConfirmationDialog({
                                      title: 'Delete Dataset Confirmation?', color: 'cancel', showModal: this.state.showDialogDelete, action: { label: "Yes", handler: this.dialogHandlerDelete }
                                    }, [div({ className: "dialog-description" }, ["Are you sure you want to delete this Dataset?"]),]),

                                    ConfirmationDialog({
                                      title: 'Disable Dataset Confirmation?', color: 'dataset', showModal: this.state.showDialogDisable, action: { label: "Yes", handler: this.dialogHandlerDisable }
                                    }, [div({ className: "dialog-description" }, ["If you disable a Dataset, Researchers won't be able to request access on it from now on. New Access elections related to this dataset won't be available but opened ones will continue."]),]),

                                    ConfirmationDialog({
                                      title: 'Enable Dataset Confirmation?', color: 'dataset', showModal: this.state.showDialogEnable, action: { label: "Yes", handler: this.dialogHandlerEnable }
                                    }, [div({ className: "dialog-description" }, ["If you enable a Dataset, Researchers will be able to request access on it from now on."]),]),

                                  ]),
                                ])
                            ])
                          }),

                          dataSet.properties.map(property => {
                            return h(Fragment, {}, [

                              td({
                                className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '')
                              }, [
                                  p({ isRendered: property.propertyName !== 'dbGAP' }, [property.propertyValue]),

                                  a({
                                    isRendered: property.propertyName === 'dbGAP',
                                    href: property.propertyValue,
                                    target: "_blank",
                                    className: (property.propertyValue.length > 0 ? 'enabled' : property.propertyValue.length === 0 ? 'disabled' : '')
                                  }, ["Link"]),
                                ])
                            ])
                          }),

                          td({ className: "table-items cell-size " + (!dataSet.active ? 'dataset-disabled' : '') }, [dataSet.consentId]),

                          td({
                            className: "table-items cell-size translated-restriction hover-color bold " + (!dataSet.active ? 'dataset-disabled' : ''),
                            onClick: this.showSdul(dataSet.translatedUseRestriction)
                          }, [
                              span({ style: { "cursor": "pointer" } }, ["Translated Use Restriction"]),
                            ]),

                          td({
                            isRendered: isAdmin, className: "table-items cell-size translated-restriction hover-color bold",
                            onClick: this.downloadList(dataSet)
                          }, [
                              span({ style: { "cursor": "pointer" } }, ["Download List"]),
                            ]),
                        ])
                    ]);
                  })

                ]),
              ]),

              div({
                className: "pvotes-pagination dataset-pagination", "dir-pagination-controls": "true",
                "max-size": "10",
                "direction-links": "true",
                "boundary-links": "true"
              }),
            ]),
            div({ className: "f-right" }, [
              button({
                isRendered: this.isResearcher,
                disabled: objectIdList.length === 0,
                onClick: this.exportToRequest(objectIdList),
                className: "download-button dataset-background apply-dataset " + (objectIdList.length === 0 ? 'disabled' : ''),
                tooltip: "Request Access for selected Datasets", "tooltip-class": "tooltip-class", "tooltip-trigger": "true",
                "tooltip-placement": "top", "tooltip-animation": "false"
              }, ["Apply for Access"]),
            ])
          ])
        ])
      ])
    );
  }
}

export default DatasetCatalog;

