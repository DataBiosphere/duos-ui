import { Component, Fragment } from 'react';
import { div, h, form, input, label, select, hh, option } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';

export const ConnectDatasetModal = hh(class ConnectDatasetModal extends Component {

  constructor() {
    super();
    this.state = {
      available: [],
      selected: [],
      availableclients: [
        { id: '0010', name: 'client 01' },
        { id: '0020', name: 'client 02' },
        { id: '0030', name: 'client 03' },
        { id: '0040', name: 'client 04' },
        { id: '0050', name: 'client 05' },
        { id: '0060', name: 'client 06' },
        { id: '0070', name: 'client 07' },
        { id: '0080', name: 'client 08' },
        { id: '0090', name: 'client 09' },
        { id: '01000', name: 'client 10' },
        { id: '01100', name: 'client 11' },
        { id: '01200', name: 'client 12' },
        { id: '01300', name: 'client 13' },
        { id: '01400', name: 'client 14' },
        { id: '01500', name: 'client 15' },
        { id: '01600', name: 'client 16' },
        { id: '01700', name: 'client 17' },
        { id: '01800', name: 'client 18' },
        { id: '01900', name: 'client 19' },
      ],
      selectedclients: [],
      needsApproval: false
    }

    this.handleNeedsApprovalChange = this.handleNeedsApprovalChange.bind(this);

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  };

  OKHandler() {
    // this is the method for handling OK click
  }

  closeHandler() {
    // this is the method to handle Cancel click
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
      prev.available = [];
      prev.availableclients = filteredFrom;
      prev.selectedclients = filteredTo;
      return prev;
    });
  }

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
  }


  handleLSelection = (e) => {
    const target = e.target;
    const value = target.value;
    const options = target.options;
    const selectedOptions = target.selectedOptions;
    console.log(options, selectedOptions);
    selectedOptions.this.setState(prev => {
        prev.available.push(value);
        return prev;
      });
  }

  handleRSelection = (e) => {
    const target = e.target;
    const value = target.value;
    const options = target.options;
    const selectedOptions = target.selectedOptions;
    console.log(options, selectedOptions);
    this.setState(prev => {
      prev.selected.push(value);
      return prev;
    });
  }

  render() {

    const { available, selected, availableclients, selectedclients } = this.state;

    return (

      BaseModal({
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
                div({ className: "select-table-title dataset-color" }, ["Data Owners"]),
                select({
                  className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 select-table-list", size: "5",
                  multiple: true, value: available, onChange: this.handleLSelection
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
                  type: "button", className: "select-table-btn select-table-btn-add default-color", value: "Add",
                  onClick: this.moveLItem
                }),

                input({
                  type: "button", className: "select-table-btn select-table-btn-remove default-color", value: "Remove",
                  onClick: this.moveRItem
                }),
              ]),

              div({ className: "col-lg-5 col-md-5 col-sm-5 col-xs-12 no-padding" }, [
                div({ className: "select-table-title dataset-color" }, ["Selected Data Owners"]),
                select({
                  className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 select-table-list", size: "5",
                  multiple: true, value: selected, onChange: this.handleRSelection
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
                input({ onChange: this.handleNeedsApprovalChange, checked: this.state.needsApproval, id: "chk_needsApproval", type: "checkbox", className: "checkbox-inline", name: "needsApproval" }),
                label({ id: "lbl_needsApproval", className: "regular-checkbox dataset-label", htmlFor: "chk_needsApproval" }, ["Needs Data Owner's approval"]),
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
