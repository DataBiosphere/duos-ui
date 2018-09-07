import { Component, Fragment } from 'react';
import { div, button, hr, h, i, input, span, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { AddOntologiesModal } from '../components/modals/AddOntologiesModal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';


class ManageOntologies extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      limit: 5,
      currentPage: 1,
      indexedFiles: [
        {
          fileurl: 'fileUrl',
          filename: 'fileName',
          ontologytype: 'OID',
          prefix: 'orsp-'
        }

      ],
      showDialogDelete: false,
    }

    this.myHandler = this.myHandler.bind(this);
    this.addOntologiesModal = this.addOntologiesModal.bind(this);
    this.closeAddOntologiesModal = this.closeAddOntologiesModal.bind(this);
    this.okAddOntologiesModal = this.okAddOntologiesModal.bind(this);
    this.afterAddOntologiesModalOpen = this.afterAddOntologiesModalOpen.bind(this);

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

  addOntologiesModal() {
    this.setState(prev => {
      prev.showModal = true;
      return prev;
    });
  }

  closeAddOntologiesModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  okAddOntologiesModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  afterAddOntologiesModalOpen() {
    // not sure when to use this
    console.log('afterAddOntologyModalOpen', this.state, this.props);
  }


  myHandler(event) {
    // TBD
  }

  downloadOntology = (e) => {

  }

  openDelete = (e) => {
    this.setState({ showDialogDelete: true });
  }

  dialogHandlerDelete = (answer) => (e) => {
    this.setState({ showDialogDelete: false });
  };
  

  render() {


    const { currentPage } = this.state;

    return (

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "manageOntologies", imgSrc: "../images/icon-manage-ontology.png", iconSize: "large", color: "common", title: "Manage Ontologies", description: "Select and manage Ontologies for index" }),
          ]),

          div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search common-color" }),
                input({
                  type: "search", className: "form-control users-search", placeholder: "Enter search term..."
                  // , "value": "searchOntologies"
                }),
              ]),
            ]),

            a({
              id: 'title_addOntologies',
              className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background no-margin",
              onClick: this.addOntologiesModal
            }, [
                div({ className: "all-icons add-ontologies-white" }),
                span({}, ["Add Ontologies"]),
              ]),
            AddOntologiesModal({
              showModal: this.state.showModal,
              onOKRequest: this.okAddOntologiesModal,
              onCloseRequest: this.closeAddOntologiesModal,
              onAfterOpen: this.afterAddOntologiesModalOpen
            }),

            hr({ className: "section-separator" })
          ])
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-row pushed-1" }, [

            div({ className: "col-5 cell-header common-color" }, ["File name"]),
            div({ className: "col-2 cell-header common-color" }, ["Type"]),
            div({ className: "col-2 cell-header common-color" }, ["Prefix"]),
          ]),
          hr({ className: "pvotes-main-separator" }),

          this.state.indexedFiles.slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((indexFile, ix) => {
            return h(Fragment, { key: ix }, [
              div({ className: "grid-row pushed-1" }, [
                a({
                  className: "col-5 cell-body text",
                  style: { "cursor": "pointer" },
                  // onClick: this.downloadOntology(),
                  filename: indexFile.filename,
                  fileurl: indexFile.fileurl
                }, [indexFile.filename]),
                div({ className: "col-2 cell-body text" }, [indexFile.ontologytype]),
                div({ className: "col-2 cell-body text" }, [indexFile.prefix]),

                div({ className: "icon-actions" }, [
                  div({ className: "display-inline-block", disabled: false }, [
                    button({ onClick: this.openDelete }, [span({ className: "glyphicon glyphicon-trash caret-margin" }),
                    ]),
                    ConfirmationDialog({
                      title: 'Delete Ontology file?', color: 'common', showModal: this.state.showDialogDelete, action: { label: "Yes", handler: this.dialogHandlerDelete }
                    }, [div({ className: "dialog-description" }, ["Are you sure you want to delete this file? The ontologies contained will be deleted from the Ontology Model."]),]),
                  ])
                ])
              ]),
              hr({ className: "pvotes-separator" }),
            ]);
          }),

          PaginatorBar({
            total: this.state.indexedFiles.length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          })
        ]),
      ])
    );
  }
}

export default ManageOntologies;

