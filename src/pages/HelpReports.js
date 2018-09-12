import { Component, Fragment } from 'react';
import { div, hr, i, input, span, a, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { HelpModal } from '../components/modals/HelpModal';

class HelpReports extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      limit: 10,
      currentPage: 1,
      reports: [
        {
          reportId: 'some id',
          userName: 'John Hongo',
          createDate: '2018-05-22',
          subject: 'some subject',
          description: 'some description'
        }
      ],
      showHelpModal: false,
      isAdmin: false

    }

    this.myHandler = this.myHandler.bind(this);
  }

  helpModal = (e) => {
    this.setState(prev => {
      prev.showHelpModal = true;
      return prev;
    });
  };

  okModal = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  closeModal = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  afterModalOpen = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  myHandler(event) {
    // TBD
  }

  render() {
    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-6 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "helpReports", imgSrc: "../images/icon_manage_help.png", iconSize: "large", color: "common", title: "Request Help Reports", description: "List of comments, suggestions and bug reports" }),
          ]),

          div({ className: "col-lg-6 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search common-color" }),
                input({
                  type: "search", className: "form-control users-search", placeholder: "Enter search term..."
                  , "value": "searchHelpReports"
                }),
              ]),
            ]),

            a({
              id: 'title_requestHelp',
              className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background no-margin",
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

          this.state.reports.slice((this.state.currentPage - 1) * this.state.limit, this.state.currentPage * this.state.limit).map((report, ix) => {
            return h(Fragment, { key: ix }, [
              div({ className: "row no-margin" }, [
                div({ className: "cell-body text " + (this.state.isAdmin ? "col-lg-1 col-md-1 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-2 col-md-2 col-sm-2 col-xs-2" : "") }, [report.reportId]),
                div({ isRendered: this.state.isAdmin, className: "cell-body text col-lg-2 col-md-2 col-sm-2 col-xs-2" }, [report.userName]),
                div({ className: "cell-body text " + (this.state.isAdmin ? "col-lg-1 col-md-1 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-2 col-md-2 col-sm-2 col-xs-2" : "") }, [report.createDate]),
                div({ className: "cell-body text " + (this.state.isAdmin ? "col-lg-3 col-md-3 col-sm-2 col-xs-2" : !this.state.isAdmin ? "col-lg-3 col-md-3 col-sm-3 col-xs-3" : "") }, [report.subject]),
                div({ className: "cell-body text " + (this.state.isAdmin ? "col-lg-5 col-md-5 col-sm-4 col-xs-4" : !this.state.isAdmin ? "col-lg-5 col-md-5 col-sm-5 col-xs-5" : "") }, [report.description]),
              ]),
              hr({ className: "table-body-separator" }),
            ]);
          }),
          PaginatorBar({
            total: this.state.reports.length,
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