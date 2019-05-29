import { Component, Fragment } from 'react';
import { div, hr, span, a, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { HelpModal } from '../components/modals/HelpModal';
import { SearchBox } from '../components/SearchBox';
import { Help } from "../libs/ajax";
import { Storage } from '../libs/storage';
import * as Utils from "../libs/utils";

class HelpReports extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      limit: 5,
      currentPage: 1,
      reports: [],
      showHelpModal: false,
      isAdmin: Storage.getCurrentUser().isAdmin
    };

    this.myHandler = this.myHandler.bind(this);
  }

  async getReportsList() {
    const reports = await Help.findHelpMeReports(Storage.getCurrentUser().dacUserId);
    this.setState(prev => {
      prev.currentPage = 1;
      prev.reports = reports;
      return prev;
    });
  }

  componentDidMount() {
    this.getReportsList();
  };

  helpModal = (e) => {
    this.setState(prev => {
      prev.showHelpModal = true;
      return prev;
    });
  };

  okModal = () => {
    this.getReportsList();
    this.setState(prev => {
      prev.showHelpModal = false;
      prev.currentPage = 1;
      return prev;
    });
  };

  closeModal = () => {
    this.setState(prev => {
      prev.showHelpModal = false;
      prev.currentPage = 1;
      return prev;
    });
  };

  afterModalOpen = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  myHandler(event) {
    // TBD
  }

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

  render() {

    const { searchDulText } = this.state;

    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-6 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "helpReports", imgSrc: "/images/icon_manage_help.png", iconSize: "large", color: "common", title: "Request Help Reports", description: "List of comments, suggestions and bug reports" }),
          ]),

          div({ className: "col-lg-6 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              h(SearchBox, { id: 'helpReports', searchHandler: this.handleSearchDul, pageHandler: this.handlePageChange, color: 'common' })
            ]),

            a({
              id: 'btn_requestHelp',
              className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary btn-add common-background no-margin",
              onClick: this.helpModal
            }, [
                div({ className: "all-icons add-help_white" }),
                span({}, ["Create a Report"]),
              ]),
            HelpModal({
              showModal: this.state.showHelpModal,
              onOKRequest: this.okModal,
              onCloseRequest: this.closeModal,
              onAfterOpen: this.afterModalOpen
            }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        div({ className: "jumbotron table-box" }, [
          div({ className: "row no-margin" }, [
            div({ className: "cell-header common-color " + (this.state.isAdmin ? "col-lg-1 col-md-1 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-2 col-md-2 col-sm-2 col-xs-2" : "") }, ["Report Id"]),
            div({ isRendered: this.state.isAdmin, className: "cell-header common-color col-lg-2 col-md-2 col-sm-2 col-xs-2" }, ["User"]),
            div({ className: "cell-header common-color " + (this.state.isAdmin ? "col-lg-1 col-md-1 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-2 col-md-2 col-sm-2 col-xs-2" : "") }, ["Date"]),
            div({ className: "cell-header common-color " + (this.state.isAdmin ? "col-lg-3 col-md-3 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-3 col-md-3 col-sm-3 col-xs-3" : "") }, ["Subject"]),
            div({ className: "cell-header common-color " + (this.state.isAdmin ? "col-lg-5 col-md-5 col-sm-4 col-xs-4" : !this.state.isAdmin ? "col-lg-5 col-md-5 col-sm-5 col-xs-5" : "") }, ["Description"]),
          ]),

          hr({ className: "table-head-separator" }),

          this.state.reports.filter(this.searchTable(searchDulText)).reverse().slice((this.state.currentPage - 1) * this.state.limit, this.state.currentPage * this.state.limit).map((report, ix) => {
            return h(Fragment, { key: ix }, [
              div({ className: "row no-margin tableRow" }, [
                div({ id: report.reportId + "_reportId", name: "reportId", className: "cell-body text " + (this.state.isAdmin ? "col-lg-1 col-md-1 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-2 col-md-2 col-sm-2 col-xs-2" : "") }, [report.reportId]),
                div({ id: report.reportId + "_userName", name: "userName", isRendered: this.state.isAdmin, className: "cell-body text col-lg-2 col-md-2 col-sm-2 col-xs-2" }, [report.userName]),
                div({ id: report.reportId + "_date", name: "date", className: "cell-body text " + (this.state.isAdmin ? "col-lg-1 col-md-1 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-2 col-md-2 col-sm-2 col-xs-2" : "") }, [Utils.formatDate(report.createDate)]),
                div({ id: report.reportId + "_subject", name: "subject", className: "cell-body text " + (this.state.isAdmin ? "col-lg-3 col-md-3 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-3 col-md-3 col-sm-3 col-xs-3" : "") }, [report.subject]),
                div({ id: report.reportId + "_description", className: "cell-body text " + (this.state.isAdmin ? "col-lg-5 col-md-5 col-sm-4 col-xs-4" : !this.state.isAdmin ? "col-lg-5 col-md-5 col-sm-5 col-xs-5" : "") }, [report.description]),
              ]),
              hr({ className: "table-body-separator" }),
            ]);
          }),
          PaginatorBar({
            total: this.state.reports.filter(this.searchTable(searchDulText)).length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          })
        ])
      ])
    );
  }
}

export default HelpReports;
