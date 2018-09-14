import { Component, Fragment } from 'react';
import { div, hr, h, span, i, a, input, button, label } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { AddDulModal } from '../components/modals/AddDulModal';
import { EditDulModal } from '../components/modals/EditDulModal';
import { Consent, Election } from '../libs/ajax';
// import _ from "lodash/fp";
import { PaginatorBar } from "../components/PaginatorBar";
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import * as Utils from '../libs/utils';

const limit = 10;

class AdminManageDul extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      showModal: false,
      value: '',
      limit: limit,
      electionsList: {
        dul: []
      },
      showDialogArchive: false,
      showDialogCancel: false,
      showDialogCreate: false,
      showDialogDelete: false,
    };

    this.myHandler = this.myHandler.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);

    this.addDul = this.addDul.bind(this);

    this.closeAddDulModal = this.closeAddDulModal.bind(this);
    this.okAddDulModal = this.okAddDulModal.bind(this);
    this.afterAddDulModalOpen = this.afterAddDulModalOpen.bind(this);

  }

  async getConsentManage() {
    Consent.getConsentManage().then(data => {
      const regex = new RegExp('-', 'g');

      let dul = data.map(election => {
        let str = election.consentName;
        str = str.replace(regex, ' ');
        election.ct = election.consentName + ' ' + election.version;
        election.cts = str + ' ' + election.version;
        return election;
      });

      this.setState(prev => {
        prev.currentPage = 1;
        prev.electionsList.dul = dul;
        return prev;
      });
    });
  }

  componentWillMount() {
    this.getConsentManage();
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

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  myHandler(event) {
    // TBD
  }

  open(electionId, page, action, status) {
    this.props.history.push(`${page}/${electionId}`)
  }

  editDul = (election) => (e) => {
    this.setState(prev => {
      prev.dulToEdit = election;
      prev.showModal = true;
      return prev;
    });
  };

  addDul() {
    this.setState(prev => {
      prev.showModal = true;
      return prev;
    });
  }

  closeAddDulModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  okAddDulModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  afterAddDulModalOpen() {
    // not sure when to use this
    console.log('afterAddDulModalOpen', this.state, this.props);
  }

  openDialogArchive = (status) => (e) => {
    if (status === 'Open') {
      this.setState({ showDialogArchiveOpen: true });
    } else if (status === 'Closed') {
      this.setState({ showDialogArchiveClosed: true });
    }
    // this.setState({ showDialogArchive: true });

  };
  openDialogCancel = (e) => {
    this.setState({ showDialogCancel: true });
  };

  openDialogCreate = (status, archived) => (e) => {
    this.setState({
      createWarning: (status === 'Closed' && archived !== true),
      showDialogCreate: true,
      createId : e.target.getAttribute('consentid')
    });
  };

  openDialogDelete = (e) => {
    this.setState({ showDialogDelete: true });
  };

  dialogHandlerArchive = (answer) => (e) => {
    console.log(answer);
    this.setState({ showDialogArchiveOpen: false });
    this.setState({ showDialogArchiveClose: false });
  };

  dialogHandlerCancel = (answer) => (e) => {
    this.setState({ showDialogCancel: false });
  };

  dialogHandlerCreate = (answer) => (e) => {
    //
    this.setState({ showDialogCreate: false });
    let consentId = this.state.createId;
    let election = { status: 'Open'};
    Election.create(consentId, election);
  };

  dialogHandlerDelete = (answer) => (e) => {
    this.setState({ showDialogDelete: false });
  };

  render() {
    const { currentPage } = this.state;


    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "manageDul", imgSrc: "/images/icon_manage_dul.png", iconSize: "medium", color: "dul", title: "Manage Data Use Limitations", description: "Select and manage Data Use Limitations for DAC review" }),
          ]),
          div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
            div({ className: "col-lg-6 col-md-6 col-sm-7 col-xs-7" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search dul-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term..."/*, value: "searchDUL"*/ }),
              ]),
            ]),

            a({ id: 'title_addDUL', className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 admin-add-button dul-background no-margin", onClick: this.addDul }, [
              div({ className: "all-icons add-dul_white" }),
              span({}, ["Add Data Use Limitations"]),
            ]),
            AddDulModal({
              showModal: this.state.showModal, onOKRequest: this.okAddDulModal, onCloseRequest: this.closeAddDulModal, onAfterOpen: this.afterAddDulModalOpen
            }),
          ]),
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-9-row pushed-2" }, [
            div({ className: "col-2 cell-header dul-color" }, ["Consent id"]),
            div({ className: "col-2 cell-header dul-color" }, ["Consent Group Name"]),
            div({ className: "col-1 cell-header dul-color" }, ["Election N°"]),
            div({ className: "col-1 cell-header dul-color" }, ["Date"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Edit Record"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Election status"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Election actions"]),
          ]),

          hr({ className: "table-head-separator" }),

          this.state.electionsList.dul.slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((election, eIndex) => {
            //---------------------
            return (
              h(Fragment, { key: election.consentId }, [
                div({ id: election.consentId, className: "grid-9-row pushed-2 " + (election.updateStatus === true ? " list-highlighted" : "") }, [
                  div({ id: election.consentId + "_consentName", className: "col-2 cell-body text " + (election.archived === true ? "flagged" : ""), title: election.consentName }, [
                    span({
                      id: election.consentId + "_flag_consentName", isRendered: election.updateStatus, className: "glyphicon glyphicon-exclamation-sign list-highlighted-item dul-color",
                      // "tooltip": "Consent has been updated", "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                    }, []),
                    a({ id: election.consentId + "_link_consentName", onClick: () => this.open(election.consentId, 'dul_preview', null, true) }, [election.consentName]),
                  ]),
                  div({ id: election.consentId + "_groupName", className: "col-2 cell-body text " + ((election.groupName === false || election.groupName === null) ? "empty" : ""), title: election.groupName }, [election.groupName]),
                  div({ id: election.consentId + "_version", className: "col-1 cell-body text " + ((election.version === false || election.version === null) ? "empty" : "") }, [election.version]),
                  div({ id: election.consentId + "_createDate", className: "col-1 cell-body text" }, [Utils.formatDate(election.createDate)]),
                  div({ id: election.consentId + "_editDUL", className: "col-1 cell-body f-center", disabled: (election.electionStatus !== 'un-reviewed' || !election.editable) }, [
                    button({ id: election.consentId + "_btn_editDUL", className: "cell-button hover-color", onClick: this.editDul(election) }, ["Edit"]),

                  ]),
                  div({ id: election.consentId + "_electionStatus", className: "col-1 cell-body text f-center bold" }, [
                    span({ isRendered: election.electionStatus === 'un-reviewed' }, [
                      a({ onClick: () => this.open(election.consentId, 'dul_preview', null, false) }, ["Un-reviewed"])]),
                    span({ isRendered: election.electionStatus === 'Open' }, [
                      a({ onClick: () => this.open(election.consentId, 'dul_collect', null, false) }, ["Open"]),]),
                    span({ isRendered: election.electionStatus === 'Canceled' }, [
                      a({ onClick: () => this.open(election.consentId, 'dul_preview', null, false) }, ["Canceled"]),]),
                    span({ isRendered: election.electionStatus === 'Closed' }, [
                      a({ onClick: () => this.open(null, 'dul_results_record', election.electionId, false) }, ["Reviewed"]),]),
                  ]),
                  div({ id: election.consentId + "_createElection", isRendered: election.electionStatus !== 'Open', className: "col-1 cell-body f-center", disabled: !election.editable }, [
                    button({ consentid: election.consentId, onClick: this.openDialogCreate(election.electionStatus, election.archived), className: "cell-button hover-color" }, ["Create"]),
                  ]),
                  div({ id: election.consentId + "_cancelElection", isRendered: election.electionStatus === 'Open', className: "col-1 cell-body f-center" }, [
                    button({ onClick: this.openDialogCancel, className: "cell-button cancel-color" }, ["Cancel"]),
                  ]),
                  div({ id: election.consentId + "_actions", className: "icon-actions" }, [
                    // "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Archive election"
                    div({ id: election.consentId + "_btn_archiveElection", className: "display-inline-block", disabled: (election.electionStatus === 'un-reviewed' || election.archived === true) }, [
                      button({ onClick: this.openDialogArchive(election.electionStatus) }, [
                        span({ className: "glyphicon caret-margin glyphicon-inbox " + (election.archived === true ? "activated" : "") })
                      ]),
                    ]),
                    // "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Delete record"
                    div({ id: election.consentId + "_btn_deleteDul", className: "display-inline-block", disabled: (election.electionStatus !== 'un-reviewed') }, [
                      button({ onClick: this.openDialogDelete }, [
                        span({ className: "glyphicon caret-margin glyphicon-trash" })
                      ]),
                    ]),
                  ]),
                ]),
                hr({ className: "table-body-separator" }),

                //------------------

                //-------------------

              ])
            )
            //-----------------
          }),
          PaginatorBar({
            total: this.state.electionsList.dul.length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          })
        ]),

        EditDulModal({
          showModal: this.state.showModal, onOKRequest: this.okAddDulModal, onCloseRequest: this.closeAddDulModal, onAfterOpen: this.afterAddDulModalOpen, dul: this.state.dulToEdit
        }),

        ConfirmationDialog({
          title: 'Archive election?', color: 'dul', showModal: this.state.showDialogArchiveOpen, action: { label: "Yes", handler: this.dialogHandlerArchive }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to archive this election? "]),
              span({ className: "no-padding display-inline" }, ["The current election will be stopped without logging a result and this case will no longer be available for DAC Review."]),
            ]),
          ]),

        ConfirmationDialog({
          title: 'Archive election?', color: 'dul', showModal: this.state.showDialogArchiveClosed, action: { label: "Yes", handler: this.dialogHandlerArchive }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to archive this election? "]),
              span({ className: "no-padding display-inline" }, ["This election result will no longer be valid."]),
            ]),
          ]),

        ConfirmationDialog({
          title: 'Cancel election?', color: 'cancel', showModal: this.state.showDialogCancel, action: { label: "Yes", handler: this.dialogHandlerCancel }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to cancel the current election process? "]),
              span({ className: "no-padding display-inline" }, ["The current election will be stopped without logging a result."]),
            ]),
            div({ className: "form-group" }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                div({ className: "checkbox" }, [
                  input({ id: "chk_archiveCancelElection", type: "checkbox", className: "checkbox-inline", checked: "checked" }),
                  label({ id: "lbl_archiveCancelElection", htmlFor: "chk_archiveCancelElection", className: "regular-checkbox normal" }, ["Archive election"]),
                ]),
              ]),
            ]),
          ]),

        ConfirmationDialog({
          title: 'Create election?', color: 'dul', showModal: this.state.showDialogCreate, action: { label: "Yes", handler: this.dialogHandlerCreate }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want the DAC to vote on this case? "]),
              span({ isRendered: this.state.createWarning, className: "no-padding display-inline" }, ["The previous election will be archived and it's result will no longer be valid."]),
            ])
          ]),

        ConfirmationDialog({
          title: 'Delete Consent?', color: 'cancel', showModal: this.state.showDialogDelete, action: { label: "Yes", handler: this.dialogHandlerDelete }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to delete this Consent?"]),
            ]),
          ])

      ])
    );
  }
}

export default AdminManageDul;
