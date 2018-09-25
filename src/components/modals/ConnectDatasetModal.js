import { Component, Fragment } from 'react';
import { div, h, form, input, label, select, hh, option } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { DatasetAssociation } from '../../libs/ajax';

export const ConnectDatasetModal = hh(class ConnectDatasetModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      available: [],
      selected: [],
      availableclients: [],
      selectedclients: [],
      needsApproval: false
    };

    this.handleNeedsApprovalChange = this.handleNeedsApprovalChange.bind(this);

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.handleLSelection  = this.handleLSelection.bind(this);
  };

  componentDidMount() {
    this.getAvailableClients(this.props.dataset);
  }

  async getAvailableClients(dataset) {
    let datasetId = '';
    dataset.properties.forEach(property => {
      if (property.propertyName === 'Dataset ID') {
        datasetId = property.propertyValue;
      }
    });

    const clients = await DatasetAssociation.getAssociatedAndToAssociateUsers(datasetId);
    const availableClients = clients.not_associated_users.map(user => {
      return { id: `"${user.dacUserId}"` , name: user.displayName+" : "+user.email};
    });
    this.setState(prev => {
      prev.availableclients = availableClients;
      return prev;
    });
  }

  OKHandler() {
    // this is the method for handling OK click
  }

  closeHandler() {
    this.props.onCloseRequest();
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...
    // and call parent's after open handler
  }

  handleNeedsApprovalChange(event) {
    this.setState({
      needsApproval: event.target.checked
    });
  }

  moveLItem = (e) => {

    let filteredTo = this.state.selectedclients;
    let filteredFrom = this.state.availableclients.filter(row => {
      if (this.state.available.includes(row.id)) {
        filteredTo.push(row);
        return false;
      }
      return true;
    });

    this.setState(prev => {
      prev.available = [];
      prev.availableclients = filteredFrom;
      prev.selectedclients = filteredTo;
      return prev;
    });
  };

  moveRItem = (e) => {

    let filteredTo = this.state.availableclients;
    let filteredFrom = this.state.selectedclients.filter(row => {
      if (this.state.selected.includes(row.id)) {
        filteredTo.push(row);
        return false;
      }
      return true;
    });

    this.setState(prev => {
      prev.available = [];
      prev.available = [];
      prev.availableclients = filteredTo;
      prev.selectedclients = filteredFrom;
      return prev;
    });
  };


  handleLSelection = (e) => {
    const target = e.target;
    const value = target.value;
    // const options = target.options;
    const selectedOptions = target.selectedOptions;
    this.setState(prev => {
        prev.available.push(value);
        return prev;
      });
  };

  handleRSelection = (e) => {
    const target = e.target;
    const value = target.value;
    // const options = target.options;
    // const selectedOptions = target.selectedOptions;
    this.setState(prev => {
      prev.selected.push(value);
      return prev;
    });
  };

  render() {

    const { available, selected, availableclients, selectedclients } = this.state;
    // console.log(availableclients, selectedclients);
    return (

      BaseModal({
        id: "connectDatasetModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_dataset_link.png",
        color: "dataset",
        iconSize: 'large',
        title: "Connect Dataset with Data Owner",
        description: 'Associate Dataset with Data Owners and check for approval',
        action: { label: "Submit", handler: this.OKHandler }
      },
        [

          form({ className: "form-horizontal css-form", name: "datasetApprovalForm", noValidate: true, encType: "multipart/form-data" }, [
            div({ className: "row", style: { 'margin': '10px 0 0 0' } }, [

              div({ className: "col-lg-5 col-md-5 col-sm-5 col-xs-12 no-padding" }, [
                div({ id: "lbl_dataOwners", className: "select-table-title dataset-color" }, ["Data Owners"]),
                select({
                  id: "sel_dataOwners",
                  className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 select-table-list",
                  size: "5",
                  multiple: true,
                  value: available,
                  onChange: this.handleLSelection
                }, [
                    this.state.availableclients.map((client, index) => {
                      return h(Fragment, { key: index }, [
                        option({ value: client.id }, [client.name]),
                      ])
                    })
                  ]),
              ]),

              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-12", style: { 'marginTop': '30px' } }, [
                input({
                  id: "btn_add",
                  type: "button",
                  className: "select-table-btn select-table-btn-add default-color",
                  value: "Add",
                  onClick: this.moveLItem
                }),

                input({
                  id: "btn_remove",
                  type: "button",
                  className: "select-table-btn select-table-btn-remove default-color",
                  value: "Remove",
                  onClick: this.moveRItem
                }),
              ]),

              div({ className: "col-lg-5 col-md-5 col-sm-5 col-xs-12 no-padding" }, [
                div({ className: "select-table-title dataset-color" }, ["Selected Data Owners"]),
                select({
                  id: "sel_selectedDataOwners",
                  className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 select-table-list",
                  size: "5",
                  multiple: true,
                  value: selected,
                  onChange: this.handleRSelection
                }, [
                    this.state.selectedclients.map((client, index) => {
                      return h(Fragment, { key: index }, [
                        option({ value: client.id }, [client.name]),
                      ])
                    })
                  ])
              ]),

            ]),

            div({ className: "form-group row", style: { 'margin': '10px 0' } }, [
              div({ className: "checkbox dataset-label" }, [
                input({ id: "chk_needsApproval",
                onChange: this.handleNeedsApprovalChange,
                checked: this.state.needsApproval,
                type: "checkbox",
                className: "checkbox-inline",
                name: "needsApproval" 
              }),
                label({ 
                  id: "lbl_needsApproval",
                  className: "regular-checkbox dataset-label",
                  htmlFor: "chk_needsApproval"
                 }, ["Needs Data Owner's approval"]),
              ]),
            ]),
          ]),
          div({ isRendered: false }, [
            Alert({ id: "modal", type: "danger", title: alert.title, description: alert.msg })
          ]),
        ])
    );
  }
});
