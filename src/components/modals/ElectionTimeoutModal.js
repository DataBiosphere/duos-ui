import { Component } from 'react';
import { div, form, input, label, hh } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { Alert } from '../Alert';
import { ElectionTimeout } from '../../libs/ajax';
import { Storage } from '../../libs/storage';
import * as Utils from "../../libs/utils";

export const ElectionTimeoutModal = hh(class ElectionTimeoutModal extends Component {

  constructor(props) {
    super(props);
    this.state = {
      timeOut:{
        amountOfDays: 7,
        createDate: null,
        displayName: '',
        id: null,
        updateDate: null,
        userId: null
      },
      updatedTimeOut: {
        amountOfDays: 0
      },
      isDataSetElection: false
    };
    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return{
      timeOut: nextProps.timeOut,
      isDataSetElection: nextProps.isDataSetElection.open
    }
  }


  timeChangeHandler = (e) => {
    const days = e.target.value;
    this.setState(prev => {
      prev.updatedTimeOut.amountOfDays = days;
      return prev;
    });
  };

  async OKHandler() {
    let approvalExpirationTime = {};
    approvalExpirationTime.userId = Storage.getCurrentUser().dacUserId;
    approvalExpirationTime.id = this.state.timeOut.id;
    approvalExpirationTime.amountOfDays = this.state.updatedTimeOut.amountOfDays;
    if (this.state.timeOut.id === null) {
      await ElectionTimeout.createApprovalExpirationTime(approvalExpirationTime);
      this.setState(prev => {prev.timeOut.amountOfDays = approvalExpirationTime.amountOfDays; return prev;});
      this.props.onOKRequest('electionTimeout');
    } else {
      await ElectionTimeout.updateApprovalExpirationTime(approvalExpirationTime);
      this.props.onOKRequest('electionTimeout');
    }
  }

  updateDate (updateDate, createDate) {
    return updateDate === null ? Utils.formatDate(createDate): Utils.formatDate(updateDate);
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('electionTimeout');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('electionTimeout');

  }

  render() {
    const { amountOfDays, createDate, displayName, id, updateDate, userId } = this.state.timeOut;

    return (

      BaseModal({
        id: "electionTimeoutModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_timeout.png",
        color: "common",
        iconName: 'manage-timeout',
        title: 'Set Data Owner election Timeout',
        description: 'Manage Data Owner election expiration time',
        action: { label: "Save", handler: this.OKHandler },
        disableOkBtn: this.state.isDataSetElection
      },
        [
          form({ className: "form-horizontal css-form", name: "consentForm", noValidate: true, encType: "multipart/form-data" }, [
            div({ className: "form-group first-form-group" }, [
              label({ id: "lbl_currentTimeout", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Current timeout:"]),
              div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 response-label" }, [
                label({ id: "txt_currentTimeout" }, [amountOfDays]),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_lastUpdatedBy", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Last updated by:"]),
              div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 response-label" }, [
                label({ id: "txt_lastUpdatedBy" }, [displayName]),
              ]),
            ]),

            div({ className: "form-group", isRendered: "timeout.updateDate != null" }, [
              label({ id: "lbl_lastUpdatedDate", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Last updated date:"]),
              div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 response-label" }, [
                label({ id: "txt_lastUpdatedDate" }, [this.updateDate(updateDate, createDate)]),
              ]),
            ]),

            div({ className: "form-group" }, [
              label({ id: "lbl_setTimeout", className: "col-lg-4 col-md-4 col-sm-6 col-xs-12 control-label common-color" }, ["Set new timeout:"]),
              div({ className: "col-lg-8 col-md-8 col-sm-6 col-xs-12" }, [
                input({ id: "txt_setTimeout", type: "number", min: "1", "ng-model": "timeout.newTimeout", name: "days", required: true, onChange: this.timeChangeHandler, value: this.state.updatedTimeOut.amountOfDays, style: { 'width': '55px', 'padding': '5px 2px 2px 5px', 'color': '#777777' } }),
              ])
            ])
          ]),

          div({ isRendered: this.state.isDataSetElection }, [
            Alert({ id: "modal", type: "danger", title: "Data Owner election Timeout value can't be updated because there are open elections."})
          ])
        ])
    );
  }
});
