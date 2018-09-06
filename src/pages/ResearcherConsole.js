import { Component, Fragment } from 'react';
import { div, button, hr, a, span, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import * as Utils from '../libs/utils';

class ResearcherConsole extends Component {

  darPageCount = 10;
  partialDarPageCount = 10;

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      currentUser: {},
      dars: [],
      partialDars: [],
      darLimit: 5,
      partialDarLimit: 5,
      currentDarPage: 1,
      currentPartialDarPage: 1

    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
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

  review = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    console.log('------------review------------', dataRequestId);
  }

  cancelDar = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    console.log('------------cancelDar------------', dataRequestId);
  }

  resume = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    console.log('------------resume------------', dataRequestId);
  }

  cancelPartialDar = (e) => {
    const dataRequestId = e.target.getAttribute('value');
    console.log('------------cancelPartialDar------------', dataRequestId);
  }

  componentWillMount() {
    this.setState(prev => {
      prev.currentUser = {
        displayName: 'Nadya Lopez Zalba',
      };
      prev.dars = [
        { dataRequestId: '1000', frontEndId: ' 100', projectTitle: 'Titlte 100', createDate: new Date(), isCanceled: false, electionVote: false, electionStatus: 'Open' },
        { dataRequestId: '1001', frontEndId: ' 101', projectTitle: 'Titlte 101', createDate: new Date(), isCanceled: false, electionVote: true, electionStatus: 'Closed' },
        { dataRequestId: '1002', frontEndId: ' 102', projectTitle: 'Titlte 102', createDate: new Date(), isCanceled: true, electionVote: false, electionStatus: 'Canceled' },
        { dataRequestId: '1003', frontEndId: ' 103', projectTitle: 'Titlte 103', createDate: new Date(), isCanceled: true, electionVote: true, electionStatus: 'un-reviewed' },
        { dataRequestId: '1004', frontEndId: ' 104', projectTitle: 'Titlte 104', createDate: new Date(), isCanceled: false, electionVote: true, electionStatus: 'PendingApproval' },
        { dataRequestId: '1005', frontEndId: ' 105', projectTitle: 'Titlte 105', createDate: new Date(), isCanceled: true, electionVote: false, electionStatus: 'Final' },
        { dataRequestId: '10010', frontEndId: ' 100', projectTitle: 'Titlte 100', createDate: new Date(), isCanceled: false, electionVote: false, electionStatus: 'Open' },
        { dataRequestId: '10011', frontEndId: ' 101', projectTitle: 'Titlte 101', createDate: new Date(), isCanceled: false, electionVote: true, electionStatus: 'Closed' },
        { dataRequestId: '10012', frontEndId: ' 102', projectTitle: 'Titlte 102', createDate: new Date(), isCanceled: true, electionVote: false, electionStatus: 'Canceled' },
        { dataRequestId: '10013', frontEndId: ' 103', projectTitle: 'Titlte 103', createDate: new Date(), isCanceled: true, electionVote: true, electionStatus: 'un-reviewed' },
        { dataRequestId: '10014', frontEndId: ' 104', projectTitle: 'Titlte 104', createDate: new Date(), isCanceled: false, electionVote: true, electionStatus: 'PendingApproval' },
        { dataRequestId: '10015', frontEndId: ' 105', projectTitle: 'Titlte 105', createDate: new Date(), isCanceled: true, electionVote: false, electionStatus: 'Final' },
      ];
      prev.partialDars = [
        { dataRequestId: '1000', frontEndId: ' 100', projectTitle: 'Titlte 100', createDate: new Date(), partial_dar_code: 'X0001', electionStatus: 'Open' },
        { dataRequestId: '1001', frontEndId: ' 101', projectTitle: 'Titlte 101', createDate: new Date(), partial_dar_code: 'X0002', electionStatus: 'Closed' },
        { dataRequestId: '1002', frontEndId: ' 102', projectTitle: 'Titlte 102', createDate: new Date(), partial_dar_code: 'X0003', electionStatus: 'Canceled' },
        { dataRequestId: '1003', frontEndId: ' 103', projectTitle: 'Titlte 103', createDate: new Date(), partial_dar_code: 'X0004', electionStatus: 'un-reviewed' },
        { dataRequestId: '1004', frontEndId: ' 104', projectTitle: 'Titlte 104', createDate: new Date(), partial_dar_code: 'X0005', electionStatus: 'Open' },
        { dataRequestId: '1005', frontEndId: ' 105', projectTitle: 'Titlte 105', createDate: new Date(), partial_dar_code: 'X0006', electionStatus: 'Closed' },
        { dataRequestId: '10010', frontEndId: ' 100', projectTitle: 'Titlte 100', createDate: new Date(), partial_dar_code: 'X0001', electionStatus: 'Open' },
        { dataRequestId: '10011', frontEndId: ' 101', projectTitle: 'Titlte 101', createDate: new Date(), partial_dar_code: 'X0002', electionStatus: 'Closed' },
        { dataRequestId: '10012', frontEndId: ' 102', projectTitle: 'Titlte 102', createDate: new Date(), partial_dar_code: 'X0003', electionStatus: 'Canceled' },
        { dataRequestId: '10013', frontEndId: ' 103', projectTitle: 'Titlte 103', createDate: new Date(), partial_dar_code: 'X0004', electionStatus: 'un-reviewed' },
        { dataRequestId: '10014', frontEndId: ' 104', projectTitle: 'Titlte 104', createDate: new Date(), partial_dar_code: 'X0005', electionStatus: 'Open' },
        { dataRequestId: '10015', frontEndId: ' 105', projectTitle: 'Titlte 105', createDate: new Date(), partial_dar_code: 'X0006', electionStatus: 'Closed' },
      ];
      return prev;
    });
  }

  render() {

    const { currentDarPage, currentPartialDarPage } = this.state;

    let currentUser = {
      displayName: 'Nadya Lopez Zalba'
    }
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
                  imgSrc: "/images/icon_access.png",
                  color: "access",
                  title: "Data Access Request cases",
                  description: "List of your Requests for Data Access"
                }),
              ]),

              a({
                className: "col-lg-3 col-md-3 col-sm-4 col-xs-12 admin-add-button access-background search-reviewed", href: "/dar_application"
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
              hr({ className: "pvotes-main-separator" }),

              this.state.dars.slice((currentDarPage - 1) * this.state.darLimit, currentDarPage * this.state.darLimit).map(dar => {
                return h(Fragment, {}, [
                  div({ key: dar.frontEndId, id: dar.frontEndId, className: "row no-margin" }, [
                    div({ id: dar.frontEndId + "_darId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [dar.frontEndId]),
                    div({ id: dar.frontEndId + "_projectTitle", className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-body text" }, [dar.projectTitle]),
                    div({ id: dar.frontEndId + "_createDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [Utils.formatDate(dar.createDate)]),
                    div({ id: dar.frontEndId + "_electionStatus", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold f-center" }, [
                      span({ isRendered: dar.electionStatus === 'un-reviewed' }, ["Submitted"]),
                      span({ isRendered: dar.electionStatus === 'Open' || dar.electionStatus === 'Final' || dar.electionStatus === 'PendingApproval' }, ["In review"]),
                      span({ isRendered: dar.electionStatus === 'Canceled' }, ["Canceled"]),
                      span({ isRendered: dar.electionStatus === 'Closed' && dar.electionVote === false }, ["DENIED"]),
                      span({ isRendered: dar.electionStatus === 'Closed' && dar.electionVote === true }, ["APPROVED"]),
                    ]),
                    div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center", disabled: dar.isCanceled }, [
                      button({ id: dar.frontEndId + "_btn_cancel", isRendered: !dar.isCanceled, className: "cell-button cancel-color", onClick: this.cancelDar, value: dar.dataRequestId }, ["Cancel"]),
                      button({ id: dar.frontEndId + "_canceled", isRendered: dar.isCanceled, className: "disabled" }, ["Canceled"]),
                    ]),
                    div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center" }, [
                      button({ id: dar.frontEndId + "_btn_review", className: "cell-button hover-color", onClick: this.review, value: dar.dataRequestId }, ["Review"]),
                    ])
                  ]),
                  hr({ className: "pvotes-separator" })
                ])
              }),

              hr({ className: "pvotes-separator" }),
              PaginatorBar({
                name: 'dar',
                total: this.state.dars.length,
                limit: this.state.darLimit,
                pageCount: this.darPageCount,
                currentPage: this.state.currentDarPage,
                onPageChange: this.handleDarPageChange,
                changeHandler: this.handleDarSizeChange,
              }),
            ]),
            div({ isRendered: ResearcherConsole.partialDars !== 0, className: "row no-margin" }, [
              PageSubHeading({
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
                hr({ className: "pvotes-main-separator" }),

                this.state.partialDars.slice((currentPartialDarPage - 1) * this.state.partialDarLimit, currentPartialDarPage * this.state.partialDarLimit).map((pdar, rIndex) => {
                  return h(Fragment, {}, [
                    div({ key: pdar.partial_dar_code, id: pdar.partial_dar_code, className: "row no-margin" }, [
                      a({ id: pdar.partial_dar_code + "_btn_delete", className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body delete-dar default-color", onClick: this.cancelPartialDar, value: pdar.dataRequestId }, [
                        span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin", "aria-hidden": "true", value: pdar.dataRequestId }),
                      ]),
                      div({ id: pdar.partial_dar_code + "_partialId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [pdar.partial_dar_code]),
                      div({ id: pdar.partial_dar_code + "_partialTitle", className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 cell-body text" }, [pdar.projectTitle]),
                      div({ id: pdar.partial_dar_code + "_partialDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [Utils.formatDate(pdar.createDate)]),
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                        button({ id: pdar.partial_dar_code + "_btn_resume", className: "cell-button hover-color", onClick: this.resume, value: pdar.dataRequestId }, ["Resume"]),
                      ]),
                    ]),
                    hr({ className: "pvotes-separator" })
                  ])
                }),
                hr({ className: "pvotes-separator" }),
                PaginatorBar({
                  name: 'partialDar',
                  total: this.state.partialDars.length,
                  limit: this.state.partialDarLimit,
                  pageCount: this.partialDarPageCount,
                  currentPage: this.state.currentPartialDarPage,
                  onPageChange: this.handlePartialDarPageChange,
                  changeHandler: this.handlePartialDarSizeChange,
                }),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default ResearcherConsole;