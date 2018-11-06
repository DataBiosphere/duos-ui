import { Component, Fragment } from 'react';
import { div, button, hr, a, span, h } from 'react-hyperscript-helpers';
import * as Utils from '../libs/utils';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { DAR, DataSet } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { Link } from 'react-router-dom';

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

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.review = this.review.bind(this);
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

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  async review(e) {
    const dataRequestId = e.target.getAttribute('value');
    const SEPARATOR = ' | ';
    let darFields = await DAR.getDarFields(dataRequestId, null);
    let formData = darFields;
    formData.datasetId = [];
    for (let detail of formData.datasetDetail) {
      let obj = {};

      obj.id = detail.datasetId;
      let ds = await this.getDsPIName(obj.id);

      if (detail.objectId !== undefined && detail.objectId !== null) {
        obj.concatenation = detail.objectId.concat(SEPARATOR, detail.name, SEPARATOR, ds.piName, SEPARATOR, ds.consentId);
      } else {
        obj.concatenation = detail.name.concat(SEPARATOR, ds.piName, SEPARATOR, ds.consentId);
      }
      formData.datasetId.push(obj);

    }
    this.props.history.push({ pathname: 'dar_application', props: { formData: formData } });

  };

  getDsPIName = async (dsId) => {
    let piName = '';
    let ds = await DataSet.getDataSetsByDatasetId(dsId);
    ds.properties.forEach(
      prop => {
        if (prop.propertyName === 'Principal Investigator(PI)') {
          piName = prop.propertyValue;
        }
      }
    );
    return { piName: piName, consentId: ds.consentId };
  }

  cancelDar = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    this.setState({ showDialogCancelDAR: true, dataRequestId: dataRequestId, alertTitle: undefined });
  };

  resume = (e) => {
    const dataRequestId = e.target.getAttribute('value');

    DAR.getPartialDarRequest(dataRequestId).then(
      data => {
        let formData = data;
        this.props.history.push({ pathname: 'dar_application', props: { formData: formData } });
      });
  };

  deletePartialDar = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    this.setState({ showDialogDeletePDAR: true, dataRequestId: dataRequestId, alertTitle: undefined });

  };

  dialogHandlerCancelDAR = (answer) => (e) => {
    this.setState({ buttonDisabled: true });
    if (answer === true) {
      DAR.cancelDar(this.state.dataRequestId).then(resp => {
        this.init(this.state.currentUser);
      }).catch(error => {
        this.setState({ alertTitle: 'Sorry, something went wrong when trying to cancel the request. Please try again.', buttonDisabled: false });
      });
    }
    else {
      this.setState({ showDialogCancelDAR: false, buttonDisabled: false, alertTitle: undefined });
    }
  };

  dialogHandlerDeletePDAR = (answer) => (e) => {
    this.setState({ buttonDisabled: true });
    if (answer === true) {
      DAR.deletePartialDarRequest(this.state.dataRequestId).then(resp => {
        this.init(this.state.currentUser);
      }).catch(error => {
        this.setState({ alertTitle: 'Sorry, something went wrong when trying to delete the request. Please try again.', buttonDisabled: false });
      });
    }
    else {
      this.setState({ showDialogDeletePDAR: false, buttonDisabled: false, alertTitle: undefined });
    }
  };

  componentDidMount() {
    let currentUser = Storage.getCurrentUser();
    this.setState({ currentUser: currentUser });
    this.init(currentUser);
  }

  init(currentUser) {

    DAR.getDataAccessManage(currentUser.dacUserId).then(
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

    DAR.getPartialDarRequestList(currentUser.dacUserId).then(
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
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "researcherConsole",
              color: "common",
              title: "Welcome " + currentUser.displayName + "!",
              description: "These are your Data Access Request cases"
            }),
            hr({ className: "section-separator" }),
          ]),

          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-9 col-md-9 col-sm-8 col-xs-12 no-padding" }, [
                PageSubHeading({
                  id: "researcherConsoleAccess",
                  imgSrc: "/images/icon_access.png",
                  color: "access",
                  title: "Data Access Request cases",
                  description: "List of your Requests for Data Access"
                }),
              ]),

              h(Link, {
                id: "btn_createRequest",
                className: "col-lg-3 col-md-3 col-sm-4 col-xs-12 btn-primary btn-add access-background search-wrapper", to: "/dar_application"
              }, [
                  div({ className: "all-icons add-access_white" }, []),
                  span({}, ["Create Data Access Request"]),
                ]),
            ]),

            div({ className: "jumbotron table-box" }, [
              div({ className: "row no-margin" }, [
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color" }, ["Data Request id"]),
                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-header access-color" }, ["Project title"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color" }, ["Date"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center access-color" }, ["Status"]),
                div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-header f-center access-color" }, ["Cancel"]),
                div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-header f-center access-color" }, ["Review"]),
              ]),
              hr({ className: "table-head-separator" }),

              this.state.dars.slice((currentDarPage - 1) * darLimit, currentDarPage * darLimit).map(dar => {
                return h(Fragment, { key: dar.frontEndId }, [
                  div({ key: dar.frontEndId, id: dar.frontEndId, className: "row no-margin tableRow" }, [
                    div({ id: dar.frontEndId + "_darId", name: "darId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [dar.frontEndId]),
                    div({ id: dar.frontEndId + "_projectTitle", name: "projectTitle", className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-body text" }, [dar.projectTitle]),
                    div({ id: dar.frontEndId + "_createDate", name: "createDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [Utils.formatDate(dar.createDate)]),
                    div({ id: dar.frontEndId + "_electionStatus", name: "electionStatus", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold f-center" }, [
                      span({ isRendered: dar.electionStatus === 'un-reviewed' }, ["Submitted"]),
                      span({ isRendered: dar.electionStatus === 'Open' || dar.electionStatus === 'Final' || dar.electionStatus === 'PendingApproval' }, ["In review"]),
                      span({ isRendered: dar.electionStatus === 'Canceled' }, ["Canceled"]),
                      span({ isRendered: dar.electionStatus === 'Closed' && dar.electionVote === false }, ["DENIED"]),
                      span({ isRendered: dar.electionStatus === 'Closed' && dar.electionVote === true }, ["APPROVED"]),
                    ]),
                    div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center", disabled: dar.isCanceled }, [
                      button({
                        id: dar.frontEndId + "_btnCancel", name: "btn_cancel", isRendered: !dar.isCanceled, className: "cell-button cancel-color",
                        onClick: this.cancelDar, value: dar.dataRequestId
                      }, ["Cancel"]),
                      button({ isRendered: dar.isCanceled, className: "disabled" }, ["Canceled"]),
                    ]),
                    div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center" }, [
                      button({
                        id: dar.frontEndId + "_btnReview", name: "btn_review", className: "cell-button hover-color", onClick: this.review,
                        value: dar.dataRequestId
                      }, ["Review"]),
                    ])
                  ]),
                  hr({ className: "table-body-separator" })
                ])
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
                color: "default",
                iconSize: "none",
                title: "Saved Data Access Requests"
              }),
              div({ className: "jumbotron table-box" }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-lg-offset-1 col-md-2 col-md-offset-1 col-sm-2 col-sm-offset-1 col-xs-2 col-xs-offset-1 cell-header default-color" }, ["Temporary id"]),
                  div({ className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 cell-header default-color" }, ["Project title"]),
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header default-color" }, ["Date"]),
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center default-color" }, ["Resume"]),
                ]),
                hr({ className: "table-head-separator" }),

                this.state.partialDars.slice((currentPartialDarPage - 1) * partialDarLimit, currentPartialDarPage * partialDarLimit).map((pdar, rIndex) => {
                  return h(Fragment, { key: pdar.partial_dar_code }, [
                    div({ key: pdar.partial_dar_code, id: pdar.partial_dar_code, className: "row no-margin tableRowPartial" }, [
                      a({
                        id: pdar.partial_dar_code + "_btnDelete", name: "btn_delete", className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body delete-dar default-color",
                        onClick: this.deletePartialDar, value: pdar.dataRequestId
                      }, [
                          span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin", "aria-hidden": "true", value: pdar.dataRequestId }),
                        ]),
                      //------
                      div({ id: pdar.partial_dar_code + "_partialId", name: "partialId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [pdar.partial_dar_code]),
                      div({ id: pdar.partial_dar_code + "_partialTitle", name: "partialTitle", className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 cell-body text" }, [pdar.projectTitle]),
                      div({ id: pdar.partial_dar_code + "_partialDate", name: "partialDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [Utils.formatDate(pdar.createDate)]),
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                        button({
                          id: pdar.partial_dar_code + "_btnResume", name: "btn_resume", className: "cell-button hover-color", onClick: this.resume,
                          value: pdar.dataRequestId
                        }, ["Resume"]),
                      ]),
                    ]),
                    hr({ className: "table-body-separator" })
                  ])
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