import { Component, Fragment } from 'react';
import { div, hr, h, span, i, a, input, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { AddDulModal } from '../components/modals/AddDulModal';
import { EditDulModal } from '../components/modals/EditDulModal';
import { CreateElectionModal } from '../components/modals/CreateElectionModal';
import { CancelElectionModal } from '../components/modals/CancelElectionModal';
import { ArchiveElectionModal } from '../components/modals/ArchiveElectionModal';
import { DeleteElectionModal } from '../components/modals/DeleteElectionModal';
import { Consent } from '../libs/ajax';
import { PaginatorBar } from '../components/PaginatorBar';

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
      }
    };

    this.myHandler = this.myHandler.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);

    this.addDul = this.addDul.bind(this);
    this.editDul = this.editDul.bind(this);
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

  openCancel() {

  }

  openArchive() {

  }

  openDelete() {

  }

  openCreate() {

  }
  editDul() {
    this.setState(prev => {
      prev.showModal = true;
      return prev;
    });
  }

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

            // this is the button-alike a to open the modal
            a({
              id: 'title_addDUL',
              className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 admin-add-button dul-background no-margin",
              onClick: this.addDul
            }, [
                div({ className: "all-icons add-dul_white" }),
                span({}, ["Add Data Use Limitations"]),
              ]),

            // this is the modal, not shown by default ...
            AddDulModal({
              showModal: this.state.showModal,
              onOKRequest: this.okAddDulModal,
              onCloseRequest: this.closeAddDulModal,
              onAfterOpen: this.afterAddDulModalOpen
            }),

            EditDulModal({
              showModal: this.state.showModal,
              onOKRequest: this.okAddDulModal,
              onCloseRequest: this.closeAddDulModal,
              onAfterOpen: this.afterAddDulModalOpen
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

          hr({ className: "pvotes-main-separator" }),
          this.state.electionsList.dul.slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((election, eIndex) => {
            return (
              h(Fragment, {key: election.consentId }, [
                div({  id: election.consentId, className: "grid-9-row pushed-2 " + (election.updateStatus === true ? " list-highlighted" : "") }, [
                  div({ id: election.consentId + "_consentName", className: "col-2 cell-body text " + (election.archived === true ? "flagged" : ""), title: election.consentName }, [
                    span({
                      id: election.consentId + "_flag_consentName", isRendered: election.updateStatus, className: "glyphicon glyphicon-exclamation-sign list-highlighted-item dul-color",
                      // "tooltip": "Consent has been updated", "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                    }, []),
                    a({ id: election.consentId + "_link_consentName", onClick: () => this.open(election.consentId, 'dul_preview', null, true) }, [election.consentName]),
                  ]),
                  div({ id: election.consentId + "_groupName", className: "col-2 cell-body text " + ((election.groupName === false || election.groupName === null) ? "empty" : ""), title: election.groupName }, [election.groupName]),
                  div({ id: election.consentId + "_version", className: "col-1 cell-body text " + ((election.version === false || election.version === null) ? "empty" : "") }, [election.version]),
                  div({ id: election.consentId + "_createDate", className: "col-1 cell-body text" }, [election.createDate]),
                  div({ id: election.consentId + "_editDUL", className: "col-1 cell-body f-center", disabled: (election.electionStatus !== 'un-reviewed' || !election.editable) }, [
                    button({
                      id: election.consentId + "_btn_editDUL",
                      className: "cell-button hover-color",
                      onClick: this.editDul
                    }, ["Edit"]),
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
                    CreateElectionModal({ electionType: 'dul', electionStatus: election.electionStatus, electionArchived: election.archived }),
                  ]),
                  div({ id: election.consentId + "_cancelElection", isRendered: election.electionStatus === 'Open', className: "col-1 cell-body f-center" }, [
                    CancelElectionModal({ electionType: 'dul' }),
                  ]),
                  div({ id: election.consentId + "_actions", className: "icon-actions" }, [
                    // "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Archive election"
                    div({ id: election.consentId + "_btn_archiveElection", className: "display-inline-block", disabled: (election.electionStatus === 'un-reviewed' || election.archived === true) }, [
                      ArchiveElectionModal({ electionArchived: election.archived, electionStatus: election.electionStatus }),
                    ]),
                    // "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Delete record"
                    div({ id: election.consentId + "_btn_deleteDul", className: "display-inline-block", disabled: (election.electionStatus !== 'un-reviewed') }, [
                      DeleteElectionModal({ electionType: 'dul' }),
                    ]),
                  ]),
                ]),
                hr({ className: "pvotes-separator" }),

              ])
            )
          }),
          PaginatorBar({
            total: this.state.electionsList.dul.length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          }),
        ])
      ])
    );
  }
}

export default AdminManageDul;
