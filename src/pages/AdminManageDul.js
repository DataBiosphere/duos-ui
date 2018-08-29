import { Component, Fragment } from 'react';
import  React from 'react';
import { div, hr, h, span, i, a, input, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { AddDulModal } from '../components/modals/AddDulModal';
import { EditDulModal } from '../components/modals/EditDulModal';
import { CreateElectionModal } from '../components/modals/CreateElectionModal';
import { CancelElectionModal } from '../components/modals/CancelElectionModal';
import { ArchiveElectionModal } from '../components/modals/ArchiveElectionModal';
import { DeleteElectionModal } from '../components/modals/DeleteElectionModal';
import { Consent } from '../libs/ajax';
import _ from "lodash/fp";
import Pagination from "react-paginating";

const limit = 10;
const pageCount = 10;

const paginatorButton = (props, label) => button(_.merge({
  style: {
    margin: '0 2px', padding: '0.25rem 0.5rem',
    border: '1px solid #ccc', borderRadius: 3,
    color: props.disabled ? '#fdce09' : '#00f', backgroundColor: 'white',
    cursor: props.disabled ? 'not-allowed' : 'pointer'
  }
}, props), label);

class AdminManageDul extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      showModal: false,
      value: '',
      electionsList: {
        dul: []
      }
    };

    this.myHandler = this.myHandler.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handlePageChange= this.handlePageChange.bind(this);

    this.addDul = this.addDul.bind(this);
    this.editDul = this.editDul.bind(this);
    this.closeAddDulModal = this.closeAddDulModal.bind(this);
    this.okAddDulModal = this.okAddDulModal.bind(this);
    this.afterAddDulModalOpen = this.afterAddDulModalOpen.bind(this);

  }

  async getConsentManage() {
    Consent.getConsentManage().then(data => {
      const regex = new RegExp('-', 'g');
      data.map(election => {
        let str = election.consentName;
        str = str.replace(regex, ' ');
        election.ct = election.consentName + ' ' + election.version;
        election.cts = str + ' ' + election.version;
        return election;
      });
      this.setState({
        electionsList: {
          dul: data
        }
      });
    });
  }

  componentWillMount() {
    this.getConsentManage();
  }

  handlePageChange = page => {
    this.setState({
      currentPage: page
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

  open() {

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
    const {currentPage} = this.state;

    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ imgSrc: "/images/icon_manage_dul.png", iconSize: "medium", color: "dul", title: "Manage Data Use Limitations", description: "Select and manage Data Use Limitations for DAC review" }),
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

        div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
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
          this.state.electionsList.dul.slice((currentPage -1) * 10, currentPage * 10).map((election, eIndex) => {
            return (
              h(Fragment, {}, [
                // div({ "dir-paginate": "election in AdminManage.electionsList.dul | filter: searchDUL | itemsPerPage:10", "current-page": this.currentDULPage }, [
                div({ key: election.electionId, id: eIndex, className: "grid-9-row pushed-2 " + (election.updateStatus === true ? " list-highlighted" : "") }, [
                  div({ className: "col-2 cell-body text " + (election.archived === true ? "flagged" : ""), title: election.consentName }, [
                    span({
                      isRendered: election.updateStatus, className: "glyphicon glyphicon-exclamation-sign list-highlighted-item dul-color",
                      // "tooltip": "Consent has been updated", "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                    }, []),
                    a({ onClick: this.open(election.consentId, 'dul_preview_results', null, true) }, [election.consentName]),
                  ]),
                  div({ className: "col-2 cell-body text " + ((election.groupName === false || election.groupName === null) ? "empty" : ""), title: election.groupName }, [election.groupName]),
                  div({ className: "col-1 cell-body text " + ((election.version === false || election.version === null) ? "empty" : "") }, [election.version]),
                  div({ className: "col-1 cell-body text" }, [election.createDate]),
                  div({ className: "col-1 cell-body f-center", disabled: (election.electionStatus !== 'un-reviewed' || !election.editable) }, [
                    button({
                      id: 'btn_editDUL',
                      className: "cell-button hover-color",
                      onClick: this.editDul
                    }, ["Edit"]),
                  ]),
                  div({ className: "col-1 cell-body text f-center bold" }, [
                    span({ isRendered: election.electionStatus === 'un-reviewed' }, [a({ onClick: this.open(election.consentId, 'dul_preview_results', null, false) }, ["Un-reviewed"])]),
                    span({ isRendered: election.electionStatus === 'Open' }, [a({ onClick: this.open(election.consentId, 'dul_review_results', null, false) }, ["Open"]),]),
                    span({ isRendered: election.electionStatus === 'Canceled' }, [a({ onClick: this.open(election.consentId, 'dul_preview_results', null, false) }, ["Canceled"]),]),
                    span({ isRendered: election.electionStatus === 'Closed' }, [a({ onClick: this.open(null, 'dul_results_record', election.electionId, false) }, ["Reviewed"]),]),
                  ]),
                  div({ isRendered: election.electionStatus !== 'Open', className: "col-1 cell-body f-center", disabled: !election.editable }, [
                    CreateElectionModal({ electionType: 'dul', electionStatus: election.electionStatus, electionArchived: election.archived }),
                  ]),
                  div({ isRendered: election.electionStatus === 'Open', className: "col-1 cell-body f-center" }, [
                    CancelElectionModal({ electionType: 'dul' }),
                  ]),
                  div({ className: "icon-actions" }, [
                    // "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Archive election"
                    div({ className: "display-inline-block", disabled: (election.electionStatus === 'un-reviewed' || election.archived === true) }, [
                      ArchiveElectionModal({ electionArchived: election.archived, electionStatus: election.electionStatus }),
                    ]),
                    // "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Delete record"
                    div({ className: "display-inline-block", disabled: (election.electionStatus !== 'un-reviewed') }, [
                      DeleteElectionModal({ electionType: 'dul' }),
                    ]),
                  ]),
                ]),
                hr({ className: "pvotes-separator" }),
                // div({
                //     "dir-pagination-controls": "true"
                //     , "max-size": "10"
                //     , "direction-links": "true"
                //     , "boundary-links": "true"
                //     , className: "pvotes-pagination"
                // }, []),
                // ])
              ])
            )
          }),
          h(Pagination, {
            total: this.state.electionsList.dul.length,  // Total results
            limit: limit, // Number of results per page
            pageCount: pageCount, // How many pages number you want to display in pagination zone.
            currentPage: currentPage // Current page number
          }, [
            ({pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps}) => h(React.Fragment, [
              div({}, [
              ]),
              // button({onClick: this.handlePageChange({pageValue: 1})}, [a("HEY")]),
              paginatorButton(_.merge({ disabled: currentPage === 1},
                getPageItemProps({ pageValue: 1, onPageChange: this.handlePageChange})),
                ['first']),

              paginatorButton(
                _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                  getPageItemProps({ pageValue: previousPage, onPageChange: this.handlePageChange})),
                ['<']
              ),

              _.map(num => paginatorButton(
                _.merge({
                    key: num,
                    style: {
                      minWidth: '2rem',
                      backgroundColor: currentPage === num ? '#0000ff' : undefined,
                      color: currentPage === num ? '#ffffff' : '#0000ff',
                      border: currentPage === num ? '#0000ff' : undefined
                    }
                  },
                  getPageItemProps({ pageValue: num, onPageChange: this.handlePageChange})),
                num), pages
              ),
              paginatorButton(
                _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                  getPageItemProps({ pageValue: nextPage, onPageChange: this.handlePageChange})),
                ['>']
              ),
              paginatorButton(
                _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                  getPageItemProps({ pageValue: totalPages, onPageChange: this.handlePageChange})),
                ['Last']
              ),
            ])
          ])
        ])
      ])
    );
  }
}

export default AdminManageDul;
