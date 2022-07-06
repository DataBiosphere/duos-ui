import { Component, Fragment } from 'react';
import { div, h, form, input, label, select, hh, option } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { DatasetAssociation, DataSet } from '../../libs/ajax';
import datasetLinkIcon from '../../images/icon_dataset_link.png';

export const ConnectDatasetModal = hh(class ConnectDatasetModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      available: [],
      selected: [],
      availableclients: [],
      selectedclients: [],
      needsApproval: props.dataset.needsApproval,
      updatedInfoModal: false,
      needsApprovalModified: false,
      showError: false,
      alert: {},
      isUpdate: false,
    };

    this.handleNeedsApprovalChange = this.handleNeedsApprovalChange.bind(this);

    this.closeHandler = this.closeHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
    this.handleLSelection  = this.handleLSelection.bind(this);
    this.handleStateSubmit = this.handleStateSubmit.bind(this);
    this.moveLItem = this.moveLItem.bind(this);
    this.moveRItem = this.moveRItem.bind(this);
  }

  componentDidMount() {
    this.getAvailableDataOwners(this.props.dataset);
  }

  async getAvailableDataOwners(dataset) {
    let datasetId = dataset.dataSetId;
    const clients = await DatasetAssociation.getAssociatedAndToAssociateUsers(datasetId);
    const availableClients = clients.not_associated_users.map(user => {
      return { id: `'${user.userId}'` , name: user.displayName+' : '+user.email};
    });

    const selectedClients = clients.associated_users.map(user => {
      return { id: `'${user.userId}'` , name: user.displayName+' : '+user.email};
    });

    this.setState(prev => {
      prev.availableclients = availableClients;
      prev.selectedclients = selectedClients;
      prev.originalDataOwners = selectedClients.slice();
      prev.datasetId = datasetId;
      prev.isUpdate = (!(clients.associated_users === undefined || clients.associated_users.length === 0));
      return prev;
    });
  }

  OKHandler() {
    if (this.state.needsApprovalModified) {
      DataSet.reviewDataSet(this.state.datasetId, this.state.needsApproval).then(() => {
        this.createOrUpdateAssociations();
      }, () => {
        this.setState(prev => {
          prev.showError = true;
          return prev;
        });
      });
    } else {
      this.createOrUpdateAssociations();
    }
  }

  createOrUpdateAssociations = () => {
    const usersId = [];
    this.state.selectedclients.forEach(user => {
      usersId.push(JSON.parse(user.id));
    });

    if (this.state.isUpdate) {
      DatasetAssociation.updateDatasetAssociations(this.state.datasetId, usersId).then(() => {
        this.props.onOKRequest('ConnectDatasetModal');
      }
      , () => {
        this.setState(prev => {
          prev.showError = true;
          return prev;
        });
      });
    } else {
      DatasetAssociation.createDatasetAssociations(this.state.datasetId, usersId).then(() => {
        this.props.onOKRequest('ConnectDatasetModal');
      }, () => {
        this.setState(prev => {
          prev.showError = true;
          return prev;
        });
      });
    }

  };

  closeHandler() {
    this.props.onCloseRequest();
  }

  handleNeedsApprovalChange(event) {
    const checked = event.target.checked;
    this.setState(prev =>{
      prev.needsApproval = checked;
      return prev;
    },
    () => this.handleStateSubmit() );
  }

  moveLItem = () => {

    let filteredTo = this.state.selectedclients;
    const availableclients = this.state.availableclients.slice();

    let filteredFrom = availableclients.filter(row => {
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
    },
    () => this.handleStateSubmit());

  };

  moveRItem = () => {

    let filteredTo = this.state.availableclients;
    const selectedclients = this.state.selectedclients.slice();

    let filteredFrom = selectedclients.filter(row => {
      if (this.state.selected.includes(row.id)) {
        filteredTo.push(row);
        return false;
      }
      return true;
    });

    this.setState(prev => {
      prev.available = [];
      prev.availableclients = filteredTo;
      prev.selectedclients = filteredFrom;
      return prev;
    },
    () => this.handleStateSubmit());

  };

  isSelectedListModified = () => {
    if (JSON.stringify(this.state.originalDataOwners) === JSON.stringify(this.state.selectedclients)) {
      return false;
    } else {
      return true;
    }
  };

  handleStateSubmit = () => {
    const modifiedList = this.isSelectedListModified();

    if (this.props.dataset.needsApproval !== this.state.needsApproval) {
      this.setState(prev => {
        prev.needsApprovalModified = true;
        return prev;
      });
    }

    if ((this.props.dataset.needsApproval !== this.state.needsApproval && this.state.selectedclients.length > 0) ||
      (modifiedList && this.state.selectedclients.length > 0) ||
      (modifiedList && this.state.needsApproval === false && this.state.selectedclients.length === 0) ) {
      this.setState({ updatedInfoModal: true });
    } else {
      this.setState({ updatedInfoModal: false });
    }

  };

  handleSelectionL = (e) => {
    const target = e.target;
    const value = target.value;
    const available = [];
    available.push(value);

    this.setState(prev => {
      prev.available = available;
      return prev;
    });
  };

  handleLSelection = () => {};

  handleRSelection = (e) => {
    const target = e.target;
    const value = target.value;
    this.setState(prev => {
      prev.selected.push(value);
      return prev;
    });
  };

  handleSelectionR = (e) => {
    const target = e.target;
    const value = target.value;
    const available = [];
    available.push(value);

    this.setState(prev => {
      prev.selected = available;
      return prev;
    });
  };

  render() {

    const { available, selected } = this.state;
    return (

      BaseModal({
        id: 'connectDatasetModal',
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        imgSrc: datasetLinkIcon,
        color: 'dataset',
        iconSize: 'large',
        title: 'Connect Dataset with Data Owner',
        description: 'Associate Dataset with Data Owners and check for approval',
        action: { label: 'Submit', handler: this.OKHandler },
        disableOkBtn: !this.state.updatedInfoModal,
      },
      [
        form({ className: 'form-horizontal css-form', name: 'datasetApprovalForm', noValidate: true, encType: 'multipart/form-data' }, [
          div({ className: 'row', style: { 'margin': '10px 0 0 0' } }, [

            div({ className: 'col-lg-5 col-md-5 col-sm-5 col-xs-12 no-padding' }, [
              div({ id: 'lbl_dataOwners', className: 'select-table-title dataset-color' }, ['Data Owners']),
              select({
                id: 'sel_dataOwners',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 select-table-list',
                size: '5',
                multiple: true,
                value: available,
                onChange: this.handleLSelection,
                onClick: this.handleSelectionL,
              }, [
                this.state.availableclients.map((client, index) => {
                  return h(Fragment, { key: index }, [
                    option({ value: client.id }, [client.name]),
                  ]);
                })
              ]),
            ]),

            div({ className: 'col-lg-2 col-md-2 col-sm-2 col-xs-12', style: { 'marginTop': '30px' } }, [
              input({
                id: 'btn_add',
                type: 'button',
                className: 'select-table-btn select-table-btn-add default-color',
                value: 'Add',
                onClick: this.moveLItem
              }),

              input({
                id: 'btn_remove',
                type: 'button',
                className: 'select-table-btn select-table-btn-remove default-color',
                value: 'Remove',
                onClick: this.moveRItem
              }),
            ]),

            div({ className: 'col-lg-5 col-md-5 col-sm-5 col-xs-12 no-padding' }, [
              div({ className: 'select-table-title dataset-color' }, ['Selected Data Owners']),
              select({
                id: 'sel_selectedDataOwners',
                className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 select-table-list',
                size: '5',
                multiple: true,
                value: selected,
                onChange: this.handleRSelection,
                onClick: this.handleSelectionR
              }, [
                this.state.selectedclients.map((client, index) => {
                  return h(Fragment, { key: index }, [
                    option({ value: client.id }, [client.name]),
                  ]);
                })
              ])
            ]),

          ]),

          div({ className: 'form-group row', style: { 'margin': '10px 0' } }, [
            div({ className: 'checkbox dataset-label' }, [
              input({ id: 'chk_needsApproval',
                onChange: this.handleNeedsApprovalChange,
                checked: this.state.needsApproval,
                type: 'checkbox',
                className: 'checkbox-inline',
                name: 'needsApproval'
              }),
              label({
                id: 'lbl_needsApproval',
                className: 'regular-checkbox dataset-label',
                htmlFor: 'chk_needsApproval'
              }, ['Needs Data Owner\'s approval']),
            ]),
          ]),
        ]),
        div({ isRendered: this.state.showError}, [
          Alert({ id: 'modal', type: 'danger', title: 'Server Error', description: 'There was an error creating the associations.'})
        ]),
      ])
    );
  }
});
