import { Component, Fragment } from 'react';
import { div, hr, h, span, a, input, button, label } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { AddDulModal } from '../components/modals/AddDulModal';
import { Consent, Election } from '../libs/ajax';
import { PaginatorBar } from "../components/PaginatorBar";
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import * as Utils from '../libs/utils';
import { SearchBox } from '../components/SearchBox';
import ReactTooltip from 'react-tooltip';

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
      dulToEdit: {},
      consentToEdit: {},
      searchDUL: '',
      showDialogArchive: false,
      showDialogCancel: false,
      showDialogCreate: false,
      showDialogDelete: false,
      archiveCheck: true,
      alertMessage: undefined,
      alertTitle: undefined,
      disableOkBtn: false,
      disableCancelBtn: false
    };

    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.addDul = this.addDul.bind(this);
    this.closeAddDulModal = this.closeAddDulModal.bind(this);
    this.okAddDulModal = this.okAddDulModal.bind(this);
    this.afterAddDulModalOpen = this.afterAddDulModalOpen.bind(this);
  }

  async getConsentManage() {
    const duls = await Consent.findConsentManage();
    this.setState(prev => {
      prev.currentPage = 1;
      prev.electionsList.dul = duls;
      prev.disableOkBtn = false;
      prev.disableCancelBtn = false;
      prev.showDialogArchiveOpen = false;
      prev.showDialogArchiveClosed = false;
      prev.showDialogCancel = false;
      return prev;
    }, async () => {
      ReactTooltip.rebuild();
    });
  }

  componentDidMount() {
    this.getConsentManage();
  }

  removeDul(consentId) {
    let updatedDul = this.state.electionsList.dul.filter(election => election.consentId !== consentId);
    this.setState(prev => {
      prev.currentPage = 1;
      prev.electionsList.dul = updatedDul;
      prev.disableOkBtn = false;
      prev.disableCancelBtn = false;
      prev.showDialogDelete = false;
      return prev;
    });
  };

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

  handleCloseModal() {
    this.setState({ showModal: false });
  }


  open(electionId, page, action, status) {
    this.props.history.push(`${page}/${electionId}`)
  }

  async editDul(election) {
    const consentData = await Consent.findConsentById(election.consentId);
    this.setState({
      dulToEdit: election,
      consentToEdit: consentData,
      showModal: true,
      isEditMode: true
    });
  };

  addDul() {
    this.setState({
      dulToEdit: null,
      consentToEdit: null,
      showModal: true,
      isEditMode: false
    });
  }

  closeAddDulModal() {
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  async okAddDulModal() {
    await this.getConsentManage();
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  afterAddDulModalOpen() {
  }

  openDialogArchive = (election) => (e) => {
    if (election.electionStatus === 'Open') {
      this.setState({ showDialogArchiveOpen: true, payload: election });
    } else {
      this.setState({ showDialogArchiveClosed: true, payload: election });
    }

  };
  openDialogCancel = (election) => (e) => {
    this.setState({
      createWarning: (election.status === 'Open'),
      showDialogCancel: true,
      payload: election,
    });
  };

  openDialogCreate = (status, archived) => (e) => {
    this.setState({
      createWarning: (status === 'Closed' && archived !== true),
      showDialogCreate: true,
      createId: e.target.getAttribute('consentid')
    });
  };

  openDialogDelete = (election) => (e) => {
    this.setState({
      showDialogDelete: true,
      deleteId: election.consentId
    });
  };

  dialogHandlerArchive = (answer) => async (e) => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer });
    if (answer) {
      let electionUpdate = {};
      let election = this.state.payload;
      electionUpdate.status = election.electionStatus === 'Open' ? 'Canceled' : election.electionStatus;
      electionUpdate.referenceId = election.consentId;
      electionUpdate.electionId = election.electionId;
      electionUpdate.archived = true;
      await Election.updateElection(electionUpdate.electionId, electionUpdate);
      this.getConsentManage();
    } else {
      this.setState({ showDialogArchiveOpen: false, showDialogArchiveClosed: false });
    }
  };

  dialogHandlerCancel = (answer) => async (e) => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer, archiveCheck: true });
    if (answer) {
      let election = this.state.payload;
      let electionUpdated = {
        status: 'Canceled',
        referenceId: election.consentId,
        electionId: election.electionId,
        archived: this.state.archiveCheck
      };
      await Election.updateElection(election.electionId, electionUpdated);
      this.getConsentManage();
    } else {
      this.setState({ showDialogCancel: false });
    }
  };

  dialogHandlerCreate = (answer) => async (e) => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer });
    if (answer) {
      let consentId = this.state.createId;
      Election.createElection(consentId).then(
        (value) => {
          this.setState({
            showDialogCreate: false,
            alertTitle: undefined,
            alertMessage: undefined
          });
          this.getConsentManage();
        }).catch(errorResponse => {
          if (errorResponse.status === 500) {
            this.setState({
              alertTitle: 'Email Service Error!',
              alertMessage: 'The election was created but the participants couldn\'t be notified by Email.',
              disableCancelBtn: false
            });
          } else {
            errorResponse.json().then(error =>
              this.setState({
                alertTitle: 'Election cannot be created!',
                alertMessage: error.message,
                disableCancelBtn: false
              })
            );
          }
        }
        );
    } else {
      this.setState({
        showDialogCreate: false,
        alertTitle: undefined,
        alertMessage: undefined,
        // disableOkBtn: false,
        // disableCancelBtn: false
      });
    }

  };

  dialogHandlerDelete = (answer) => (e) => {
    this.setState({ disableOkBtn: answer, disableCancelBtn: answer });
    if (answer) {
      let consentId = this.state.deleteId;
      Consent.deleteConsent(consentId).then(data => {
        if (data.ok) {
          this.removeDul(consentId);
        }
      });
    } else {
      this.setState({ showDialogDelete: false });
    }
  };

  handleArchiveCheckbox = (e) => {
    this.setState({ archiveCheck: e.target.checked });
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

  render() {

    const { currentPage, limit, searchDulText } = this.state;

    return (
      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "manageDul",
              imgSrc: "/images/icon_manage_dul.png",
              iconSize: "medium",
              color: "dul",
              title: "Manage Data Use Limitations",
              description: "Select and manage Data Use Limitations for DAC review"
            }),
          ]),
          div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
            div({ className: "col-lg-6 col-md-6 col-sm-7 col-xs-7" }, [
              h(SearchBox, { id: 'manageDul', searchHandler: this.handleSearchDul, pageHandler: this.handlePageChange, color: 'dul' })
            ]),

            a({
              id: 'btn_addDUL',
              className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 btn-primary btn-add dul-background",
              onClick: this.addDul
            }, [
                div({ className: "all-icons add-dul_white" }),
                span({}, ["Add Data Use Limitations"]),
              ])
          ])
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

          this.state.electionsList.dul.filter(this.searchTable(searchDulText)).slice((currentPage - 1) * limit, currentPage * limit).map((election, eIndex) => {
            return (
              h(Fragment, { key: election.consentId }, [
                div({
                  id: election.consentId, className: "grid-9-row pushed-2 tableRow " + (election.updateStatus === true ? " list-highlighted" : "")
                },
                  [
                    div({
                      id: election.consentId + "_consentId",
                      name: "consentId",
                      className: "col-2 cell-body text " + (election.archived === true ? "flagged" : ""),
                      title: election.consentName
                    },
                      [
                        span({
                          id: election.consentId + "_flagConsentId",
                          name: "flag_consentId",
                          isRendered: election.updateStatus,
                          className: "glyphicon glyphicon-exclamation-sign list-highlighted-item dul-color",
                          "data-tip": "Consent has been updated",
                          "data-for": "tip_flag"
                        }, []),
                        a({
                          id: election.consentId + "_linkConsentName",
                          name: "link_consentName",
                          onClick: () => this.open(election.consentId, 'dul_preview', null, true)
                        }, [election.consentName]),
                      ]),
                    div({
                      id: election.consentId + "_groupName",
                      name: "groupName",
                      className: "col-2 cell-body text " + ((election.groupName === false || election.groupName === null) ? "empty" : ""),
                      title: election.groupName
                    }, [election.groupName]),
                    div({
                      id: election.consentId + "_version",
                      name: "version",
                      className: "col-1 cell-body text " + ((election.version === false || election.version === null) ? "empty" : "")
                    }, [election.version]),
                    div({
                      id: election.consentId + "_createDate",
                      name: "createDate",
                      className: "col-1 cell-body text"
                    }, [Utils.formatDate(election.createDate)]),
                    div({
                      className: "col-1 cell-body f-center",
                      disabled: (election.electionStatus !== 'un-reviewed' || !election.editable)
                    },
                      [
                        button({
                          id: election.consentId + "_btnEditDUL",
                          name: "btn_editDul",
                          className: "cell-button hover-color",
                          onClick: () => this.editDul(election)
                        }, ["Edit"]),

                      ]),
                    div({ className: "col-1 cell-body text f-center bold" }, [
                      span({ isRendered: election.electionStatus === 'un-reviewed' }, [
                        a({ id: election.consentId + "_linkUnreviewed", name: "link_unreviewed", onClick: () => this.open(election.consentId, 'dul_preview', null, false) }, ["Un-reviewed"])]),
                      span({ isRendered: election.electionStatus === 'Open' }, [
                        a({ id: election.consentId + "_linkOpen", name: "link_open", onClick: () => this.open(election.consentId, 'dul_collect', null, false) }, ["Open"]),]),
                      span({ isRendered: election.electionStatus === 'Canceled' }, [
                        a({ id: election.consentId + "_linkCanceled", name: "link_canceled", onClick: () => this.open(election.consentId, 'dul_preview', null, false) }, ["Canceled"]),]),
                      span({ isRendered: election.electionStatus === 'Closed' }, [
                        a({ id: election.consentId + "_linkReviewed", name: "link_reviewed", onClick: () => this.open(election.electionId, 'dul_results_record', election.electionId, false) }, [election.vote]),]),
                    ]),
                    div({
                      isRendered: election.electionStatus !== 'Open',
                      className: "col-1 cell-body f-center",
                      disabled: !election.editable
                    },
                      [
                        button({
                          id: election.consentId + "_btnCreate",
                          name: "btn_create",
                          consentid: election.consentId,
                          onClick: this.openDialogCreate(election.electionStatus, election.archived),
                          className: "cell-button hover-color"
                        }, ["Create"]),
                      ]),
                    div({
                      isRendered: election.electionStatus === 'Open',
                      className: "col-1 cell-body f-center"
                    },
                      [
                        button({
                          id: election.consentId + "_btnCancel",
                          name: "btn_cancel",
                          consentid: election.consentId,
                          onClick: this.openDialogCancel(election),
                          className: "cell-button cancel-color"
                        }, ["Cancel"]),
                      ]),
                    div({ className: "icon-actions" }, [
                      div({
                        className: "display-inline-block",
                        disabled: (election.electionStatus === 'un-reviewed' || election.archived === true)
                      }, [
                          button({
                            id: election.consentId + "_btnArchiveElection",
                            name: "btn_archiveElection",
                            onClick: this.openDialogArchive(election)
                          }, [
                              span({
                                className: "glyphicon caret-margin glyphicon-inbox " + (election.archived === true ? "activated" : ""),
                                "data-tip": "Archive election",
                                "data-for": "tip_archive"
                              })
                            ])
                        ]),
                      div({
                        className: "display-inline-block",
                        disabled: (election.electionStatus !== 'un-reviewed' || election.electionStatus === 'Canceled')
                      }, [
                          button({
                            id: election.consentId + "_btnDeleteDul",
                            name: "btn_deleteDul",
                            onClick: this.openDialogDelete(election)
                          }, [
                              span({
                                className: "glyphicon caret-margin glyphicon-trash",
                                "data-tip": "Delete record",
                                "data-for": "tip_delete"
                              })
                            ])
                        ])
                    ])
                  ]),
                hr({ className: "table-body-separator" })
              ])
            )
          }),
          PaginatorBar({
            total: this.state.electionsList.dul.filter(this.searchTable(searchDulText)).length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          })
        ]),

        AddDulModal({
          isRendered: this.state.showModal,
          showModal: this.state.showModal,
          isEditMode: this.state.isEditMode,
          onOKRequest: this.okAddDulModal,
          onCloseRequest: this.closeAddDulModal,
          onAfterOpen: this.afterAddDulModalOpen,
          dul: this.state.dulToEdit,
          editConsent: this.state.consentToEdit
        }),

        ConfirmationDialog({
          isRendered: this.state.showDialogArchiveOpen,
          showModal: this.state.showDialogArchiveOpen,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Archive election?',
          color: 'dul',
          payload: this.state.payload,
          action: { label: "Yes", handler: this.dialogHandlerArchive }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to archive this election? "]),
              span({ className: "no-padding display-inline" }, ["The current election will be stopped without logging a result and this case will no longer be available for DAC Review."]),
            ]),
          ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogArchiveClosed,
          showModal: this.state.showDialogArchiveClosed,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Archive election?',
          color: 'dul',
          payload: this.state.payload,
          action: { label: "Yes", handler: this.dialogHandlerArchive }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to archive this election? "]),
              span({ className: "no-padding display-inline" }, ["This election result will no longer be valid."]),
            ]),
          ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogCancel,
          showModal: this.state.showDialogCancel,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Cancel election?',
          color: 'cancel',
          payload: this.state.payload,
          action: { label: "Yes", handler: this.dialogHandlerCancel }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to cancel the current election process? "]),
              span({ className: "no-padding display-inline" }, ["The current election will be stopped without logging a result."]),
            ]),
            div({ className: "form-group" }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                div({ className: "checkbox" }, [
                  input({
                    id: "chk_archiveCancelElection",
                    type: "checkbox",
                    className: "checkbox-inline",
                    defaultChecked: this.state.archiveCheck,
                    onChange: this.handleArchiveCheckbox
                  }),
                  label({
                    id: "lbl_archiveCancelElection",
                    htmlFor: "chk_archiveCancelElection",
                    className: "regular-checkbox normal"
                  }, ["Archive election"]),
                ]),
              ]),
            ]),
          ]),


        ConfirmationDialog({
          isRendered: this.state.showDialogCreate,
          showModal: this.state.showDialogCreate,
          title: 'Create election?',
          color: 'dul',
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          action: { label: "Yes", handler: this.dialogHandlerCreate },
          alertMessage: this.state.alertMessage,
          alertTitle: this.state.alertTitle

        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want the DAC to vote on this case? "]),
              span({
                isRendered: this.state.createWarning,
                className: "no-padding display-inline"
              }, ["The previous election will be archived and it's result will no longer be valid."]),
            ])
          ]),

        ConfirmationDialog({
          isRendered: this.state.showDialogDelete,
          showModal: this.state.showDialogDelete,
          disableOkBtn: this.state.disableOkBtn,
          disableNoBtn: this.state.disableCancelBtn,
          title: 'Delete Consent?',
          color: 'cancel',
          action: { label: "Yes", handler: this.dialogHandlerDelete }
        }, [
            div({ className: "dialog-description" }, [
              span({}, ["Are you sure you want to delete this Consent?"]),
            ]),
          ]),
        h(ReactTooltip, {
          id: "tip_archive",
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: "tip_delete",
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
        h(ReactTooltip, {
          id: "tip_flag",
          place: 'right',
          effect: 'solid',
          multiline: true,
          className: 'tooltip-wrapper'
        }),
      ])
    );
  }
}

export default AdminManageDul;
