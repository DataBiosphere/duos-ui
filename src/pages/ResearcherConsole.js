import { Component, Fragment } from 'react';
import { div, button, hr, a, span, h } from 'react-hyperscript-helpers';
import * as Utils from '../libs/utils';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { DAR } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Link } from 'react-router-dom';
import { Theme } from '../libs/theme';
import accessIcon from "../images/icon_access.png";

class ResearcherConsole extends Component {

  darPageCount = 10;
  partialDarPageCount = 20;

  constructor(props) {
    super(props);
    this.state = {
      buttonDisabled: false,
      showModal: false,
      currentUser: {},
      dars: [],
      partialDars: [],
      darLimit: 5,
      partialDarLimit: 5,
      currentDarPage: 1,
      currentPartialDarPage: 1,
      showDialogCancelDAR: false,
      showDialogDeletePDAR: false,
      alertTitle: undefined
    };
  }

  handleDarPageChange = page => {
    this.setState(prev => {
      prev.currentDarPage = page;
      return prev;
    });
  };

  handlePartialDarPageChange = page => {
    this.setState(prev => {
      prev.currentPartialDarPage = page;
      return prev;
    });
  };

  handleDarSizeChange = size => {
    this.setState(prev => {
      prev.darLimit = size;
      return prev;
    });
  };

  handlePartialDarSizeChange = size => {
    this.setState(prev => {
      prev.partialDarLimit = size;
      return prev;
    });
  };

  sortDars = Utils.getColumnSort(() => { return this.state ? this.state.dars: []; }, (sortedData, descendantOrder) => {
    this.setState(prev => {
      prev.dars = sortedData;
      prev.darDescOrder = !descendantOrder;
      return prev;
    });
  });

  sortPartials = Utils.getColumnSort(() => { return this.state ? this.state.partialDars: []; }, (sortedData, descendantOrder) => {
    this.setState(prev => {
      prev.partialDars = sortedData;
      prev.partialDescOrder = !descendantOrder;
      return prev;
    });
  });

  cancelDar = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    this.setState({ showDialogCancelDAR: true, dataRequestId: dataRequestId, alertTitle: undefined });
  };

  deletePartialDar = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    this.setState({ showDialogDeletePDAR: true, dataRequestId: dataRequestId, alertTitle: undefined });

  };

  dialogHandlerCancelDAR = (answer) => () => {
    this.setState({ buttonDisabled: true });
    if (answer === true) {
      DAR.cancelDar(this.state.dataRequestId).then(() => {
        this.init();
      }).catch(() => {
        this.setState({ alertTitle: 'Sorry, something went wrong when trying to cancel the request. Please try again.', buttonDisabled: false });
      });
    } else {
      this.setState({ showDialogCancelDAR: false, buttonDisabled: false, alertTitle: undefined });
    }
  };

  dialogHandlerDeletePDAR = (answer) => () => {
    this.setState({ buttonDisabled: true });
    if (answer === true) {
      DAR.deleteDar(this.state.dataRequestId).then(() => {
        this.init();
      }).catch(() => {
        this.setState({ alertTitle: 'Sorry, something went wrong when trying to delete the request. Please try again.', buttonDisabled: false });
      });
    } else {
      this.setState({ showDialogDeletePDAR: false, buttonDisabled: false, alertTitle: undefined });
    }
  };

  componentDidMount() {
    let currentUser = Storage.getCurrentUser();
    this.setState({ currentUser: currentUser });
    this.init();
  }

  init() {

    DAR.getDataAccessManage().then(
      dars => {
        this.setState({
          dars: dars,
          showDialogDeletePDAR: false,
          buttonDisabled: false,
          showDialogCancelDAR: false,
          alertTitle: undefined
        });
      }
    );

    DAR.getPartialDarRequestList().then(
      pdars => {
        this.setState({
          partialDars: pdars,
          showDialogDeletePDAR: false,
          buttonDisabled: false,
          showDialogCancelDAR: false,
          alertTitle: undefined
        });
      }
    );
  }

  render() {

    const { currentUser, currentDarPage, darLimit, currentPartialDarPage, partialDarLimit } = this.state;

    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-xs-12 no-padding" }, [
            PageHeading({
              id: "researcherConsole",
              color: "common",
              title: "Welcome to your Researcher Console, " + currentUser.displayName + "!",
              description: "Your Data Access Requests are below"
            }),
            hr({ className: "section-separator" }),
          ]),

          div({ className: "col-xs-12 no-padding" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-md-9 col-sm-8 col-xs-12 no-padding" }, [
                PageSubHeading({
                  id: "researcherConsoleAccess",
                  imgSrc: accessIcon,
                  color: "access",
                  title: "Your Data Access Requests",
                  description: "List of your Data Access Requests"
                }),
              ]),

              h(Link, {
                id: "btn_createRequest",
                className: "col-md-3 col-sm-4 col-xs-12 btn-primary btn-add access-background search-wrapper", to: "/dar_application"
              }, [
                div({ className: "all-icons add-access_white" }, []),
                span({}, ["Create Data Access Request"]),
              ]),
            ]),

            div({ style: Theme.lightTable }, [
              div({ className: "row no-margin" }, [
                div({ style: Theme.textTableHead, className: "col-xs-2 cell-sort access-color", onClick: this.sortDars({
                  sortKey: 'frontEndId',
                  descendantOrder: this.state.darDescOrder
                }) }, [
                  "Data Request ID",
                  span({ className: 'glyphicon sort-icon glyphicon-sort' })
                ]),
                div({ style: Theme.textTableHead, className: "col-xs-4 cell-sort access-color", onClick: this.sortDars({
                  sortKey: 'projectTitle',
                  descendantOrder: this.state.darDescOrder
                }) }, [
                  "Project Title",
                  span({ className: 'glyphicon sort-icon glyphicon-sort' })
                ]),
                div({ style: Theme.textTableHead, className: "col-xs-2 cell-sort access-color", onClick: this.sortDars({
                  sortKey: 'createDate',
                  descendantOrder: this.state.darDescOrder
                }) }, [
                  "Date",
                  span({ className: 'glyphicon sort-icon glyphicon-sort' })
                ]),
                div({ style: Theme.textTableHead, className: "col-xs-2 cell-sort f-center access-color", onClick: this.sortDars({
                  sortKey: 'electionStatus',
                  descendantOrder: this.state.darDescOrder
                }) }, [
                  "Status",
                  span({ className: 'glyphicon sort-icon glyphicon-sort' })
                ]),
                div({ style: Theme.textTableHead, className: "col-xs-1 f-center access-color" }, ["Cancel"]),
                div({ style: Theme.textTableHead, className: "col-xs-1 f-center access-color" }, ["Review"]),
              ]),
              hr({ className: "table-head-separator" }),

              this.state.dars.slice((currentDarPage - 1) * darLimit, currentDarPage * darLimit).map(dar => {
                return h(Fragment, { key: dar.frontEndId }, [
                  div({ key: dar.frontEndId, id: dar.frontEndId, className: "row no-margin tableRow" }, [
                    div({ style: Theme.textTableBody, id: dar.frontEndId + "_darId", name: "darId", className: "col-xs-2" }, [dar.frontEndId]),
                    div({ style: Theme.textTableBody, id: dar.frontEndId + "_projectTitle", name: "projectTitle", className: "col-xs-4" }, [dar.projectTitle]),
                    div({ style: Theme.textTableBody, id: dar.frontEndId + "_createDate", name: "createDate", className: "col-xs-2" }, [Utils.formatDate(dar.createDate)]),
                    div({ style: Theme.textTableBody, id: dar.frontEndId + "_electionStatus", name: "electionStatus", className: "col-xs-2 bold f-center" }, [
                      span({ isRendered: dar.electionStatus === 'un-reviewed' }, ["Submitted"]),
                      span({ isRendered: dar.electionStatus === 'Open' || dar.electionStatus === 'Final' || dar.electionStatus === 'PendingApproval' }, ["In review"]),
                      span({ isRendered: dar.electionStatus === 'Canceled' }, ["Canceled"]),
                      span({ isRendered: dar.electionStatus === 'Closed' && dar.electionVote === false }, ["Denied"]),
                      span({ isRendered: dar.electionStatus === 'Closed' && dar.electionVote === true }, ["Approved"]),
                    ]),
                    div({ className: "col-xs-1 cell-body f-center", disabled: dar.electionStatus !== 'un-reviewed'}, [
                      button({
                        id: dar.frontEndId + "_btnCancel", name: "btn_cancel", isRendered: !dar.isCanceled, className: "cell-button cancel-color",
                        onClick: this.cancelDar, value: dar.dataRequestId
                      }, ["Cancel"]),
                      button({ isRendered: dar.isCanceled, className: "disabled" }, ["Canceled"]),
                    ]),
                    div({ className: "col-xs-1 cell-body f-center" }, [
                      button({
                        id: dar.frontEndId + "_btnReview", name: "btn_review", className: "cell-button hover-color"
                      }, [h(Link, {
                        to: 'dar_application/' + dar.dataRequestId,
                      }, ['Review'])]),
                    ])
                  ]),
                  hr({ className: "table-body-separator" })
                ]);
              }),
              PaginatorBar({
                name: 'dar',
                total: this.state.dars.length,
                limit: darLimit,
                pageCount: this.darPageCount,
                currentPage: currentDarPage,
                onPageChange: this.handleDarPageChange,
                changeHandler: this.handleDarSizeChange,
              }),
            ]),
            div({ isRendered: ResearcherConsole.partialDars !== 0, className: "row no-margin" }, [
              PageSubHeading({
                id: "researcherConsoleSavedAccess",
                color: "access",
                iconSize: "none",
                title: "Saved Data Access Requests"
              }),
              div({ style: Theme.lightTable }, [
                div({ className: "row no-margin" }, [
                  div({ style: Theme.textTableHead, className: "col-xs-2 col-xs-offset-1 cell-sort access-color", onClick: this.sortPartials({
                    sortKey: 'partialDarCode',
                    descendantOrder: this.state.partialDescOrder
                  }) }, [
                    "Temporary ID",
                    span({ className: 'glyphicon sort-icon glyphicon-sort' })
                  ]),
                  div({ style: Theme.textTableHead, className: "col-xs-5 cell-sort access-color", onClick: this.sortPartials({
                    sortKey: 'projectTitle',
                    descendantOrder: this.state.partialDescOrder
                  }) }, [
                    "Project Title",
                    span({ className: 'glyphicon sort-icon glyphicon-sort' })
                  ]),
                  div({ style: Theme.textTableHead, className: "col-xs-2 cell-sort access-color", onClick: this.sortPartials({
                    sortKey: 'createDate',
                    descendantOrder: this.state.partialDescOrder
                  }) }, [
                    "Date",
                    span({ className: 'glyphicon sort-icon glyphicon-sort' })
                  ]),
                  div({ style: Theme.textTableHead, className: "col-xs-2 f-center access-color" }, ["Resume"]),
                ]),
                hr({ className: "table-head-separator" }),

                this.state.partialDars.slice((currentPartialDarPage - 1) * partialDarLimit, currentPartialDarPage * partialDarLimit).map((pdar, idx) => {
                  return h(Fragment, { key: pdar.partialDarCode + '_' + idx }, [
                    div({ key: pdar.partialDarCode, id: pdar.partialDarCode, className: "row no-margin tableRowPartial" }, [
                      a({
                        id: pdar.partialDarCode + "_btnDelete",
                        name: "btn_delete",
                        className: "col-xs-1 cell-body delete-dar default-color",
                        onClick: this.deletePartialDar, value: pdar.dataRequestId
                      }, [
                        span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin", "aria-hidden": "true", value: pdar.dataRequestId }),
                      ]),

                      div({ style: Theme.textTableBody, id: pdar.partialDarCode + "_partialId", name: "partialId", className: "col-xs-2" }, [pdar.partialDarCode]),
                      div({ style: Theme.textTableBody, id: pdar.partialDarCode + "_partialTitle", name: "partialTitle", className: "col-xs-5" }, [pdar.projectTitle]),
                      div({ style: Theme.textTableBody, id: pdar.partialDarCode + "_partialDate", name: "partialDate", className: "col-xs-2" }, [Utils.formatDate(pdar.createDate)]),
                      div({className: "col-xs-2 cell-body f-center" }, [
                        button({
                          id: pdar.partialDarCode + '_btnResume',
                          name: 'btn_resume',
                          className: 'cell-button hover-color',
                        }, [
                          h(Link, {
                            to: 'dar_application/' + pdar.dataRequestId,
                          }, ['Resume'])],
                        ),
                      ]),
                    ]),
                    hr({ className: "table-body-separator" })
                  ]);
                }),
                PaginatorBar({
                  name: 'partialDar',
                  total: this.state.partialDars.length,
                  limit: partialDarLimit,
                  pageCount: this.partialDarPageCount,
                  currentPage: currentPartialDarPage,
                  onPageChange: this.handlePartialDarPageChange,
                  changeHandler: this.handlePartialDarSizeChange,
                }),
              ]),
            ]),
          ]),
        ]),
        ConfirmationDialog({
          title: 'Cancel saved Request?',
          color: 'cancel',
          isRendered: this.state.showDialogCancelDAR,
          showModal: this.state.showDialogCancelDAR,
          disableOkBtn: this.state.buttonDisabled,
          action: { label: "Yes", handler: this.dialogHandlerCancelDAR }
        }, [div({ className: "dialog-description" }, ["Are you sure you want to cancel this Data Access Request?"]),]),

        ConfirmationDialog({
          title: 'Delete saved Request?',
          color: 'cancel',
          isRendered: this.state.showDialogDeletePDAR,
          showModal: this.state.showDialogDeletePDAR,
          disableOkBtn: this.state.buttonDisabled,
          action: { label: "Yes", handler: this.dialogHandlerDeletePDAR },
          alertTitle: this.state.alertTitle,
        }, [div({ className: "dialog-description" }, ["Are you sure you want to delete this Data Access Request?"]),])

      ])

    );
  }
}

export default ResearcherConsole;
